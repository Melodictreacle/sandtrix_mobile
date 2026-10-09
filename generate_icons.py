import zlib
import struct
import math

def create_png(width, height, get_pixel_func):
    """Generate a valid PNG file using pure standard library (zlib & struct)."""
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter byte: 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_data.extend((r, g, b, a))

    def make_chunk(chunk_type, data):
        length = len(data)
        crc = zlib.crc32(chunk_type + data) & 0xffffffff
        return struct.pack('>I', length) + chunk_type + data + struct.pack('>I', crc)

    png_header = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0) # RGBA 8-bit
    ihdr = make_chunk(b'IHDR', ihdr_data)
    idat = make_chunk(b'IDAT', zlib.compress(bytes(raw_data), 9))
    iend = make_chunk(b'IEND', b'')

    return png_header + ihdr + idat + iend

def icon_pixel(x, y, w, h):
    # Normalized coords [0, 1]
    nx = x / w
    ny = y / h

    # Rounded rectangle background #12151C
    margin = 0.06
    corner_r = 0.22
    if nx < margin or nx > 1 - margin or ny < margin or ny > 1 - margin:
        # Check rounded corners
        cx = margin + corner_r if nx < margin + corner_r else (1 - margin - corner_r)
        cy = margin + corner_r if ny < margin + corner_r else (1 - margin - corner_r)
        if (nx < margin + corner_r or nx > 1 - margin - corner_r) and (ny < margin + corner_r or ny > 1 - margin - corner_r):
            dist = math.sqrt((nx - cx)**2 + (ny - cy)**2)
            if dist > corner_r:
                return (0, 0, 0, 0) # Transparent

    # Base background: Deep dark slate (#12, #15, #1C)
    r, g, b = 18, 21, 28

    # Tetris T-shape sand blocks in center
    # Center is at (0.5, 0.5)
    # Block size is 0.18
    bs = 0.18
    # Top horizontal bar of T: 3 blocks across (x in [0.23, 0.77], y in [0.32, 0.50])
    # Vertical stalk of T: 1 block down (x in [0.41, 0.59], y in [0.50, 0.68])
    if 0.32 <= ny < 0.50:
        if 0.23 <= nx < 0.41:
            return (235, 75, 75, 255)  # Crimson Red
        elif 0.41 <= nx < 0.59:
            return (245, 185, 35, 255) # Amber Gold
        elif 0.59 <= nx < 0.77:
            return (40, 185, 100, 255) # Emerald Green
    elif 0.50 <= ny < 0.68:
        if 0.41 <= nx < 0.59:
            return (0, 210, 215, 255)  # Turquoise Aqua (Water block)

    # Subtle cyan border
    border_thickness = 0.015
    if (abs(nx - margin) < border_thickness or abs(nx - (1 - margin)) < border_thickness or
        abs(ny - margin) < border_thickness or abs(ny - (1 - margin)) < border_thickness):
        return (0, 210, 215, 220)

    return (r, g, b, 255)

if __name__ == '__main__':
    for size in (192, 512):
        png_bytes = create_png(size, size, icon_pixel)
        filename = f"icon-{size}.png"
        with open(filename, "wb") as f:
            f.write(png_bytes)
        print(f"Generated {filename} ({size}x{size})")
