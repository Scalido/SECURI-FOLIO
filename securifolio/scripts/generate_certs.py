import os
from PIL import Image, ImageDraw, ImageFont

def generate_cert(filename, nom, numero_cadastral, volume, folio, circonscription, superficie, date_etab, rature=False):
    width, height = 800, 1000
    # Background color resembling old paper
    img = Image.new('RGB', (width, height), color='#fdfbf7')
    draw = ImageDraw.Draw(img)

    # Add a border
    draw.rectangle([20, 20, width-20, height-20], outline="#cbd5e1", width=10)
    draw.rectangle([25, 25, width-25, height-25], outline="#94a3b8", width=2)

    # Load a font (default fallback if specific fonts aren't available)
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
        subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
        label_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
        value_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    except IOError:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        label_font = ImageFont.load_default()
        value_font = ImageFont.load_default()

    # Header texts
    draw.text((width/2, 80), "RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", font=title_font, fill="#1e293b", anchor="mm")
    draw.text((width/2, 130), "MINISTÈRE DES AFFAIRES FONCIÈRES", font=subtitle_font, fill="#334155", anchor="mm")
    draw.text((width/2, 200), "CERTIFICAT D'ENREGISTREMENT", font=title_font, fill="#0f172a", anchor="mm")
    draw.text((width/2, 240), "(Titre de Concession Perpétuelle)", font=subtitle_font, fill="#64748b", anchor="mm")

    start_y = 350
    line_height = 65

    fields = [
        ("Circonscription Foncière :", circonscription),
        ("Numéro d'Enregistrement de la Parcelle :", numero_cadastral),
        ("Superficie de la Concession :", superficie),
        ("Volume du Registre :", volume),
        ("Folio du Registre :", folio),
        ("Inscrit au Nom de (Propriétaire) :", nom),
        ("Fait à Kinshasa, le :", date_etab),
    ]

    for i, (label, val) in enumerate(fields):
        y = start_y + i * line_height
        draw.text((80, y), label, font=label_font, fill="#64748b")
        
        val_x = 450
        # If rature is True and it's the surface, draw a crossed out text
        if rature and "Superficie" in label:
            draw.text((val_x, y), "450 m²", font=value_font, fill="#0f172a")
            # Strike through
            draw.line([val_x, y + 10, val_x + 80, y + 10], fill="red", width=3)
            # Write new text next to it
            draw.text((val_x + 100, y), val, font=value_font, fill="#0f172a")
        else:
            draw.text((val_x, y), val, font=value_font, fill="#0f172a")

        # underline
        draw.line([80, y + 30, width - 80, y + 30], fill="#e2e8f0", width=2)

    # Official Seal
    seal_x, seal_y = width - 150, height - 150
    draw.ellipse([seal_x - 70, seal_y - 70, seal_x + 70, seal_y + 70], outline=(220, 38, 38, 150), width=5)
    draw.ellipse([seal_x - 60, seal_y - 60, seal_x + 60, seal_y + 60], outline=(220, 38, 38, 100), width=2)
    
    draw.text((seal_x, seal_y - 20), "RDC", font=label_font, fill=(220, 38, 38, 150), anchor="mm")
    draw.text((seal_x, seal_y), "CADASTRE", font=label_font, fill=(220, 38, 38, 150), anchor="mm")
    draw.text((seal_x, seal_y + 20), "OFFICIEL", font=label_font, fill=(220, 38, 38, 150), anchor="mm")

    # Signature
    draw.line([100, height - 150, 300, height - 150], fill="#0f172a", width=2)
    draw.text((200, height - 130), "Le Conservateur des Titres", font=label_font, fill="#64748b", anchor="mm")
    
    # Save the image
    img.save(filename)
    print(f"Generated: {filename}")

# Create outputs
output_dir = "demo/1_smart_archive"
os.makedirs(output_dir, exist_ok=True)

# 1. Authentique
generate_cert(
    os.path.join(output_dir, "certificat_1_authentique.png"),
    "Augustin Mwamba", "SU/GOM/1023", "A120", "45", "Gombe", "450 m²", "12 Mars 2018"
)

# 2. Falsifié (Rature)
generate_cert(
    os.path.join(output_dir, "certificat_2_falsifie_rature.png"),
    "Faux Propriétaire 1", "SU/GOM/1023", "X999", "45", "Gombe", "1000 m²", "14 Mai 2024",
    rature=True
)

# 3. Litige
generate_cert(
    os.path.join(output_dir, "certificat_3_litige.png"),
    "Pierre Kasongo", "SU/KIM/871", "K11", "03", "Kisenso", "320 m²", "09 Septembre 2021"
)

# 4. Faux Titre (Inconnu)
generate_cert(
    os.path.join(output_dir, "certificat_4_inconnu.png"),
    "Michel Kabasele", "SU/NGO/777", "Z55", "09", "Ngaliema", "500 m²", "22 Juillet 2023"
)
