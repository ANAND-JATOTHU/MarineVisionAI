import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def create_synthetic_sonar_image(filepath, debris_type):
    width, height = 800, 600
    
    # 1. Base Sea Floor (Dark Navy/Blue/Black gradient with noise)
    base_color = (10, 20, 35)
    img = Image.new('RGB', (width, height), color=base_color)
    draw = ImageDraw.Draw(img)
    
    # Generate backscatter noise (acoustic texture)
    noise_array = np.random.normal(loc=15, scale=10, size=(height, width, 3)).astype(np.uint8)
    noise_img = Image.fromarray(noise_array, mode='RGB')
    
    # Blend noise with base
    img = Image.blend(img, noise_img, alpha=0.3)
    
    # Add some seabed ripples (lines)
    for i in range(0, height, 40):
        if np.random.rand() > 0.5:
            draw.line([(0, i), (width, i + np.random.randint(-20, 20))], fill=(20, 35, 55), width=2)
            
    # 2. Add Anomaly (Debris)
    if debris_type == "ghost_net":
        # Draw a messy net
        net_x, net_y = 400, 300
        for _ in range(20):
            x1 = net_x + np.random.randint(-50, 50)
            y1 = net_y + np.random.randint(-50, 50)
            x2 = net_x + np.random.randint(-50, 50)
            y2 = net_y + np.random.randint(-50, 50)
            draw.line([(x1, y1), (x2, y2)], fill=(200, 220, 255), width=1)
        # Acoustic shadow
        draw.ellipse([net_x-40, net_y+20, net_x+60, net_y+60], fill=(0, 0, 5))
        
    elif debris_type == "plastic_bottle":
        # Small bright cylinder
        bx, by = 600, 200
        draw.rectangle([bx, by, bx+20, by+40], fill=(255, 255, 255))
        # Shadow
        draw.polygon([(bx, by+40), (bx+20, by+40), (bx+30, by+70), (bx+10, by+70)], fill=(0, 0, 5))

    elif debris_type == "sunken_pipe":
        # Long thick line
        px, py = 200, 400
        draw.line([(px, py), (px+150, py-50)], fill=(220, 220, 220), width=15)
        # Shadow parallel
        draw.line([(px+10, py+15), (px+160, py-35)], fill=(0, 0, 5), width=20)
        
    # Apply a slight blur to simulate underwater acoustics
    img = img.filter(ImageFilter.GaussianBlur(radius=1.5))
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    img.save(filepath)
    print(f"Generated {filepath}")

if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    samples_dir = os.path.join(base_dir, "test_samples")
    
    create_synthetic_sonar_image(os.path.join(samples_dir, "test_ghost_net.jpg"), "ghost_net")
    create_synthetic_sonar_image(os.path.join(samples_dir, "test_plastic_bottle.jpg"), "plastic_bottle")
    create_synthetic_sonar_image(os.path.join(samples_dir, "test_sunken_pipe.jpg"), "sunken_pipe")
    print("Done! Test samples ready.")
