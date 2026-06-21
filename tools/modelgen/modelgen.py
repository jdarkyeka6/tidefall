import sys
import trimesh

# Commands:
# room W D H T
# box W D H X Y Z
# hallway L W H DOORS
# export filename.glb

def make_box(w, d, h, x=0, y=0, z=0):
    m = trimesh.creation.box(extents=(w, d, h))
    m.apply_translation((x, y, z + h/2))
    return m

def make_room(w, d, h, t):
    floor = make_box(w, d, t, 0, 0, 0)
    wall_n = make_box(w, t, h, 0,  d/2 - t/2, 0)
    wall_s = make_box(w, t, h, 0, -d/2 + t/2, 0)
    wall_e = make_box(t, d, h,  w/2 - t/2, 0, 0)
    wall_w = make_box(t, d, h, -w/2 + t/2, 0, 0)
    return trimesh.util.concatenate([floor, wall_n, wall_s, wall_e, wall_w])

def make_hallway(length, width, height, doors):
    meshes = []

    # floor
    meshes.append(make_box(length, width, 0.2, 0, 0, 0))

    # walls
    meshes.append(make_box(length, 0.2, height, 0,  width/2, 0))
    meshes.append(make_box(length, 0.2, height, 0, -width/2, 0))

    # doors (simple blocks for now)
    spacing = length / (doors + 1)
    door_w = 1.0
    door_h = 2.2
    door_d = 0.1

    for i in range(doors):
        x = -length/2 + spacing * (i + 1)
        meshes.append(make_box(door_w, door_d, door_h, x,  width/2 - 0.1, 0))
        meshes.append(make_box(door_w, door_d, door_h, x, -width/2 + 0.1, 0))

    return trimesh.util.concatenate(meshes)

def run(script_path):
    with open(script_path, "r", encoding="utf-8") as f:
        lines = [ln.strip() for ln in f.readlines()]

    meshes = []
    out_name = "out.glb"

    for line in lines:
        if not line or line.startswith("#"):
            continue

        parts = line.split()
        cmd = parts[0].lower()

        if cmd == "room":
            w, d, h, t = map(float, parts[1:5])
            meshes.append(make_room(w, d, h, t))

        elif cmd == "box":
            w, d, h, x, y, z = map(float, parts[1:7])
            meshes.append(make_box(w, d, h, x, y, z))

        elif cmd == "hallway":
            l, w, h, dcount = map(float, parts[1:5])
            meshes.append(make_hallway(l, w, h, int(dcount)))

        elif cmd == "export":
            out_name = parts[1]

        else:
            raise ValueError(f"Unknown command: {cmd}")

    scene = trimesh.Scene(meshes)
    data = scene.export(file_type="glb")

    with open(out_name, "wb") as f:
        f.write(data)

    print("✅ Exported:", out_name)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: py modelgen.py scripts\\file.txt")
        sys.exit(1)
    run(sys.argv[1])
