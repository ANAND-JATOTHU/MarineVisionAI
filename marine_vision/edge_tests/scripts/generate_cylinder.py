import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def create_cylinder_image(filepath):
    width, height = 800, 600
    base_color = (15, 25, 40)
    img = Image.new('RGB', (width, height), color=base_color)
    draw = ImageDraw.Draw(img)
    
    # Backscatter noise
    noise = np.random.normal(loc=20, scale=12, size=(height, width, 3)).astype(np.uint8)
    noise_img = Image.fromarray(noise, mode='RGB')
    img = Image.blend(img, noise_img, alpha=0.35)
    
    # Cylinder (Bright acoustic return)
    cx, cy = 400, 300
    # The body of the cylinder
    draw.polygon([(cx, cy), (cx+60, cy-40), (cx+80, cy-10), (cx+20, cy+30)], fill=(220, 230, 255))
    
    # The acoustic shadow (pitch black)
    draw.polygon([(cx+30, cy+20), (cx+90, cy-20), (cx+140, cy-10), (cx+110, cy+40)], fill=(0, 0, 0))
    
    img = img.filter(ImageFilter.GaussianBlur(radius=1.2))
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    img.save(filepath)

if __name__ == "__main__":
    create_cylinder_image("marine_vision/test_samples/dataset/sonar_cylinder_image.jpg")
    print("Generated cylinder dataset.")
