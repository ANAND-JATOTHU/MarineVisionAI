import os
import numpy as np
from PIL import Image, ImageFilter

def create_waterfall_image(filepath):
    width, height = 800, 1000
    base_color = (10, 18, 30)
    img = Image.new('RGB', (width, height), color=base_color)
    
    # Generate static noise
    noise = np.random.normal(loc=15, scale=10, size=(height, width, 3)).astype(np.uint8)
    noise_img = Image.fromarray(noise, mode='RGB')
    img = Image.blend(img, noise_img, alpha=0.5)
    
    # Add vertical streaks (towfish acoustic blind spots)
    pixels = img.load()
    for x in range(width):
        if x % 400 < 5:
            for y in range(height):
                pixels[x, y] = (0, 0, 0)
    
    # Add some horizontal acoustic returns (seabed ripples)
    for _ in range(50):
        y = np.random.randint(0, height)
        for x in range(width):
            if np.random.random() > 0.5:
                r, g, b = pixels[x, y]
                pixels[x, y] = (min(255, r+30), min(255, g+40), min(255, b+60))
                
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    img.save(filepath)

if __name__ == "__main__":
    create_waterfall_image("marine_vision/frontend/public/waterfall_bg.jpg")
    print("Generated waterfall background.")
