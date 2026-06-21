import bpy
import math
import os
import traceback

def log(msg):
    print(msg, flush=True)

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # Purge orphan data (safe in background)
    try:
        for _ in range(3):
            bpy.ops.outliner.orphans_purge(do_recursive=True)
    except Exception:
        pass

def make_material(name, rgba, rough=0.6, metallic=0.0):
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    return m
