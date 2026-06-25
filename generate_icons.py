import struct
import zlib
import os

def create_png(width, height, bg_color, text_color, letter):
    """Generate a PNG image with a letter centered."""
    pixels = []
    for y in range(height):
        for x in range(width):
            # Dark background with subtle gradient
            r, g, b = bg_color
            # Light grain effect
            import random
            noise = random.randint(-3, 3)
            pixels.append((
                max(0, min(255, r + noise)),
                max(0, min(255, g + noise)),
                max(0, min(255, b + noise))
            ))

    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc

    # IHDR: 8-bit RGB
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)

    # Build raw image data with filter byte 0 per row
    raw = b''
    for y in range(height):
        raw += b'\x00'  # filter none
        for x in range(width):
            i = y * width + x
            raw += bytes(pixels[i])

    compressed = zlib.compress(raw)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')

    return png


def add_text_to_pixels(pixels, width, height, text_color, bg_color):
    """Draw a simple centered letter 'Б' using a bitmap overlay."""
    # Define a simple bitmap for letter 'Б' (Cyrillic Be)
    # 7x7 grid (scaled to fit)
    letter_bitmap = [
        [1,1,1,1,1,1,0],  #  ██████
        [1,0,0,0,0,0,0],  #  █
        [1,0,0,0,0,0,0],  #  █
        [1,1,1,1,1,0,0],  #  █████
        [1,0,0,0,0,1,0],  #  █    █
        [1,0,0,0,0,1,0],  #  █    █
        [1,1,1,1,1,1,0],  #  ██████
    ]

    cell_w = width // 10
    cell_h = height // 10
    start_x = (width - len(letter_bitmap[0]) * cell_w) // 2
    start_y = (height - len(letter_bitmap) * cell_h) // 2

    for by, row in enumerate(letter_bitmap):
        for bx, val in enumerate(row):
            if val:
                cx = start_x + bx * cell_w
                cy = start_y + by * cell_h
                for dy in range(cell_h):
                    for dx in range(cell_w):
                        px = cx + dx
                        py = cy + dy
                        if 0 <= px < width and 0 <= py < height:
                            i = py * width + px
                            pixels[i] = text_color


os.makedirs('icons', exist_ok=True)

for size in [192, 512]:
    bg = (13, 13, 13)       # #0d0d0d
    gold = (200, 169, 110)  # #C8A96E

    pixels = [(bg[0], bg[1], bg[2]) for _ in range(size * size)]
    add_text_to_pixels(pixels, size, size, gold, bg)

    png_data = create_png(size, size, bg, gold, '')
    # We need to regenerate with the modified pixels — pass them into create_png properly
    # Actually, let's refactor: write pixels directly into create_png

    # Recreate properly
    raw = b''
    for y in range(size):
        raw += b'\x00'
        for x in range(size):
            i = y * size + x
            raw += bytes(pixels[i])

    compressed = zlib.compress(raw)

    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')

    path = f'icons/icon-{size}.png'
    with open(path, 'wb') as f:
        f.write(png)
    print(f'Created {path} ({len(png)} bytes)')

print('Done!')