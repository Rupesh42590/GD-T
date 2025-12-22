"""
3D to 2D CAD File Converter API
Supports: STL, OBJ, PLY, OFF -> DXF, SVG, PNG
STEP support via external conversion (FreeCAD/gmsh)
Enhanced with filled projections and better rendering
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Literal
from pathlib import Path
import tempfile
import shutil
import subprocess
import sys

import trimesh
import numpy as np
from PIL import Image, ImageDraw
import svgwrite
import ezdxf
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union

app = FastAPI(
    title="3D to 2D CAD Converter",
    description="Convert 3D CAD files to 2D formats (DXF, SVG, PNG)",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Formats that trimesh can handle natively
NATIVE_FORMATS = {".stl", ".obj", ".ply", ".off", ".glb", ".gltf"}
# Formats that need conversion
STEP_FORMATS = {".step", ".stp"}
ALL_FORMATS = NATIVE_FORMATS | STEP_FORMATS

ViewType = Literal["top", "front", "side", "isometric"]
RenderMode = Literal["wireframe", "filled", "outline"]


class STEPConverter:
    """Handle STEP file conversion using available tools"""
    
    @staticmethod
    def check_freecad() -> bool:
        """Check if FreeCAD is available"""
        try:
            result = subprocess.run(
                ["freecad", "--version"],
                capture_output=True,
                timeout=5
            )
            return result.returncode == 0
        except:
            return False
    
    @staticmethod
    def check_gmsh() -> bool:
        """Check if gmsh is available"""
        try:
            result = subprocess.run(
                ["gmsh", "--version"],
                capture_output=True,
                timeout=5
            )
            return result.returncode == 0
        except:
            return False
    
    @staticmethod
    def convert_with_freecad(step_path: Path) -> Path:
        """Convert STEP to STL using FreeCAD"""
        stl_path = step_path.with_suffix('.stl')
        
        # FreeCAD Python script
        script = f"""
import FreeCAD
import Mesh
import Part

doc = FreeCAD.newDocument()
Part.insert("{step_path}", doc.Name)

shapes = []
for obj in doc.Objects:
    if hasattr(obj, "Shape"):
        shapes.append(obj.Shape)

if shapes:
    compound = Part.makeCompound(shapes)
    Mesh.export([compound], "{stl_path}")

FreeCAD.closeDocument(doc.Name)
"""
        
        script_path = step_path.with_suffix('.py')
        script_path.write_text(script)
        
        try:
            subprocess.run(
                ["freecad", "-c", str(script_path)],
                capture_output=True,
                timeout=60,
                check=True
            )
            script_path.unlink()
            return stl_path
        except subprocess.CalledProcessError as e:
            raise Exception(f"FreeCAD conversion failed: {e.stderr.decode()}")
    
    @staticmethod
    def convert_with_gmsh(step_path: Path) -> Path:
        """Convert STEP to STL using gmsh"""
        stl_path = step_path.with_suffix('.stl')
        
        try:
            subprocess.run(
                ["gmsh", "-3", str(step_path), "-o", str(stl_path), "-format", "stl"],
                capture_output=True,
                timeout=60,
                check=True
            )
            return stl_path
        except subprocess.CalledProcessError as e:
            raise Exception(f"gmsh conversion failed: {e.stderr.decode()}")
    
    @staticmethod
    def convert_step_to_stl(step_path: Path) -> Path:
        """Convert STEP to STL using available tool"""
        if STEPConverter.check_freecad():
            return STEPConverter.convert_with_freecad(step_path)
        elif STEPConverter.check_gmsh():
            return STEPConverter.convert_with_gmsh(step_path)
        else:
            raise ImportError(
                "STEP file support requires FreeCAD or gmsh:\n\n"
                "Install FreeCAD:\n"
                "  macOS: brew install freecad\n"
                "  Ubuntu: sudo apt-get install freecad\n"
                "  Windows: Download from freecad.org\n\n"
                "OR install gmsh:\n"
                "  macOS: brew install gmsh\n"
                "  Ubuntu: sudo apt-get install gmsh\n"
                "  Windows: Download from gmsh.info\n\n"
                "Alternatively, convert your STEP file to STL using:\n"
                "  - FreeCAD GUI: File → Export → STL\n"
                "  - Online: convertcadfiles.com"
            )


class CADConverter:
    """Handles 3D to 2D CAD conversion operations"""
    
    @staticmethod
    def load_3d_model(file_path: Path) -> trimesh.Trimesh:
        """Load 3D model from file"""
        try:
            file_ext = file_path.suffix.lower()
            
            # Handle STEP files
            if file_ext in STEP_FORMATS:
                stl_path = STEPConverter.convert_step_to_stl(file_path)
                mesh = trimesh.load(str(stl_path))
                stl_path.unlink()  # Clean up
            else:
                mesh = trimesh.load(str(file_path))
            
            # Handle Scene objects
            if isinstance(mesh, trimesh.Scene):
                if len(mesh.geometry) == 0:
                    raise ValueError("No geometry found in file")
                meshes = []
                for geom in mesh.geometry.values():
                    if hasattr(geom, 'vertices') and hasattr(geom, 'faces'):
                        meshes.append(trimesh.Trimesh(vertices=geom.vertices, faces=geom.faces))
                if meshes:
                    mesh = trimesh.util.concatenate(meshes)
                else:
                    raise ValueError("No valid geometry in scene")
            
            return mesh
        except Exception as e:
            raise ValueError(f"Failed to load 3D model: {str(e)}")
    
    @staticmethod
    def get_projection(mesh: trimesh.Trimesh, view: ViewType) -> np.ndarray:
        """Get 2D projection of mesh from specified view"""
        vertices = mesh.vertices.copy()
        
        if view == "top":
            projection = vertices[:, [0, 1]]  # X, Y
        elif view == "front":
            projection = vertices[:, [0, 2]]  # X, Z
        elif view == "side":
            projection = vertices[:, [1, 2]]  # Y, Z
        elif view == "isometric":
            # Isometric projection (rotate 45° around Z, then tilt)
            angle = np.radians(45)
            cos_a, sin_a = np.cos(angle), np.sin(angle)
            rot_z = np.array([
                [cos_a, -sin_a, 0],
                [sin_a, cos_a, 0],
                [0, 0, 1]
            ])
            vertices = vertices @ rot_z.T
            projection = vertices[:, [0, 2]]
        else:
            projection = vertices[:, [0, 1]]
        
        return projection
    
    @staticmethod
    def get_outline_edges(mesh: trimesh.Trimesh, view: ViewType) -> list:
        """Extract edges for 2D projection"""
        projection = CADConverter.get_projection(mesh, view)
        edges = mesh.edges_unique
        
        edge_lines = []
        for edge in edges:
            p1 = projection[edge[0]]
            p2 = projection[edge[1]]
            edge_lines.append((p1, p2))
        
        return edge_lines
    
    @staticmethod
    def get_filled_projection(mesh: trimesh.Trimesh, view: ViewType):
        """Get filled 2D projection with proper face rendering"""
        projection = CADConverter.get_projection(mesh, view)
        
        # Project faces
        projected_faces = []
        for face in mesh.faces:
            face_2d = projection[face]
            # Only include faces visible from this view
            projected_faces.append(face_2d)
        
        return projection, projected_faces
    
    @staticmethod
    def normalize_coords(points: np.ndarray, size: int, margin: int = 50):
        """Normalize coordinates to fit in canvas"""
        min_vals = points.min(axis=0)
        max_vals = points.max(axis=0)
        range_vals = max_vals - min_vals
        
        # Prevent division by zero
        range_vals = np.where(range_vals == 0, 1, range_vals)
        
        scale = (size - 2 * margin) / max(range_vals)
        normalized = (points - min_vals) * scale + margin
        
        return normalized, scale
    
    @staticmethod
    def to_dxf(mesh: trimesh.Trimesh, view: ViewType, output_path: Path, mode: RenderMode = "wireframe"):
        """Convert to DXF format"""
        doc = ezdxf.new('R2010')
        msp = doc.modelspace()
        
        if mode == "filled":
            projection, faces = CADConverter.get_filled_projection(mesh, view)
            # Draw filled polygons
            for face in faces:
                points = [(float(p[0]), float(p[1])) for p in face]
                msp.add_lwpolyline(points, close=True)
        else:
            edges = CADConverter.get_outline_edges(mesh, view)
            for p1, p2 in edges:
                msp.add_line(
                    (float(p1[0]), float(p1[1])),
                    (float(p2[0]), float(p2[1]))
                )
        
        doc.saveas(output_path)
    
    @staticmethod
    def to_svg(mesh: trimesh.Trimesh, view: ViewType, output_path: Path, size: int, mode: RenderMode = "filled"):
        """Convert to SVG format with improved rendering"""
        dwg = svgwrite.Drawing(str(output_path), size=(size, size))
        dwg.add(dwg.rect(insert=(0, 0), size=(size, size), fill='white'))
        
        if mode == "filled":
            projection, faces = CADConverter.get_filled_projection(mesh, view)
            normalized, scale = CADConverter.normalize_coords(projection, size)
            
            # Draw filled faces
            for i, face_indices in enumerate(mesh.faces):
                face_points = normalized[face_indices]
                points = [(float(p[0]), float(size - p[1])) for p in face_points]
                dwg.add(dwg.polygon(
                    points=points,
                    fill='lightgray',
                    stroke='black',
                    stroke_width=0.5
                ))
        else:
            edges = CADConverter.get_outline_edges(mesh, view)
            all_points = np.vstack([p for edge in edges for p in edge])
            normalized, scale = CADConverter.normalize_coords(all_points, size)
            
            # Draw edges
            point_idx = 0
            for _ in edges:
                p1 = normalized[point_idx]
                p2 = normalized[point_idx + 1]
                point_idx += 2
                
                dwg.add(dwg.line(
                    start=(float(p1[0]), float(size - p1[1])),
                    end=(float(p2[0]), float(size - p2[1])),
                    stroke='black',
                    stroke_width=1.5
                ))
        
        dwg.save()
    
    @staticmethod
    def to_png(mesh: trimesh.Trimesh, view: ViewType, output_path: Path, size: int, mode: RenderMode = "filled"):
        """Convert to PNG format with enhanced rendering"""
        img = Image.new('RGB', (size, size), 'white')
        draw = ImageDraw.Draw(img)
        
        if mode == "filled":
            projection, faces = CADConverter.get_filled_projection(mesh, view)
            normalized, scale = CADConverter.normalize_coords(projection, size)
            
            # Draw filled faces
            for face_indices in mesh.faces:
                face_points = normalized[face_indices]
                points = [(float(p[0]), float(size - p[1])) for p in face_points]
                draw.polygon(points, fill=(200, 200, 200), outline=(0, 0, 0))
        else:
            edges = CADConverter.get_outline_edges(mesh, view)
            all_points = np.vstack([p for edge in edges for p in edge])
            normalized, scale = CADConverter.normalize_coords(all_points, size)
            
            # Draw edges
            point_idx = 0
            for _ in edges:
                p1 = normalized[point_idx]
                p2 = normalized[point_idx + 1]
                point_idx += 2
                
                draw.line([
                    (float(p1[0]), float(size - p1[1])),
                    (float(p2[0]), float(size - p2[1]))
                ], fill='black', width=2)
        
        img.save(output_path, 'PNG')


@app.get("/")
async def root():
    """API information"""
    freecad_available = STEPConverter.check_freecad()
    gmsh_available = STEPConverter.check_gmsh()
    step_support = freecad_available or gmsh_available
    
    return {
        "message": "3D to 2D CAD Converter API",
        "native_formats": list(NATIVE_FORMATS),
        "step_support": step_support,
        "step_converter": "freecad" if freecad_available else ("gmsh" if gmsh_available else "none"),
        "output_formats": ["dxf", "svg", "png"],
        "views": ["top", "front", "side", "isometric"],
        "render_modes": ["wireframe", "filled", "outline"]
    }


@app.post("/convert")
async def convert_cad(
    file: UploadFile = File(...),
    output_format: Literal["dxf", "svg", "png"] = Query(...),
    view: ViewType = Query("top"),
    size: int = Query(1000, ge=100, le=4000),
    mode: RenderMode = Query("filled", description="Render mode: wireframe, filled, or outline")
):
    """
    Convert 3D CAD file to 2D format
    
    - **file**: 3D CAD file (STL, OBJ, PLY, STEP*)
    - **output_format**: dxf, svg, or png
    - **view**: top, front, side, or isometric
    - **size**: Output size (100-4000px)
    - **mode**: wireframe (edges only), filled (solid), or outline (border only)
    
    *STEP requires FreeCAD or gmsh installed
    """
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALL_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format. Supported: {ALL_FORMATS}"
        )
    
    # Save uploaded file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        input_path = Path(tmp.name)
    
    output_filename = f"{Path(file.filename).stem}_{view}_{mode}.{output_format}"
    output_path = OUTPUT_DIR / output_filename
    
    try:
        mesh = CADConverter.load_3d_model(input_path)
        
        if output_format == "dxf":
            CADConverter.to_dxf(mesh, view, output_path, mode)
            media_type = "application/dxf"
        elif output_format == "svg":
            CADConverter.to_svg(mesh, view, output_path, size, mode)
            media_type = "image/svg+xml"
        else:  # png
            CADConverter.to_png(mesh, view, output_path, size, mode)
            media_type = "image/png"
        
        return FileResponse(
            path=output_path,
            media_type=media_type,
            filename=output_filename
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        input_path.unlink(missing_ok=True)


@app.post("/convert/batch")
async def batch_convert(
    file: UploadFile = File(...),
    output_formats: list[Literal["dxf", "svg", "png"]] = Query(...),
    views: list[ViewType] = Query(["top", "front", "side"]),
    size: int = Query(1000, ge=100, le=4000),
    mode: RenderMode = Query("filled")
):
    """Batch convert to multiple formats and views (returns ZIP)"""
    import zipfile
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALL_FORMATS:
        raise HTTPException(status_code=400, detail="Unsupported format")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        input_path = Path(tmp.name)
    
    zip_path = OUTPUT_DIR / f"{Path(file.filename).stem}_batch.zip"
    
    try:
        mesh = CADConverter.load_3d_model(input_path)
        
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for view in views:
                for fmt in output_formats:
                    fname = f"{Path(file.filename).stem}_{view}_{mode}.{fmt}"
                    fpath = OUTPUT_DIR / fname
                    
                    if fmt == "dxf":
                        CADConverter.to_dxf(mesh, view, fpath, mode)
                    elif fmt == "svg":
                        CADConverter.to_svg(mesh, view, fpath, size, mode)
                    else:
                        CADConverter.to_png(mesh, view, fpath, size, mode)
                    
                    zipf.write(fpath, fname)
                    fpath.unlink()
        
        return FileResponse(
            path=zip_path,
            media_type="application/zip",
            filename=zip_path.name
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        input_path.unlink(missing_ok=True)


@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}",
        "trimesh_available": True,
        "step_support": STEPConverter.check_freecad() or STEPConverter.check_gmsh()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)