import csv
import random

# Liste des 100 plus grandes villes du monde (exemple réduit ici, à compléter)
big_cities = [
    "Tokyo", "Delhi", "Shanghai", "Dhaka", "Paris",
    "São Paulo", "Mexico", "Pékin", "Mumbai", "Osaka",
    "Chongqing", "Karachi", "Kinshasa", "Lagos", "Istanbul",
    "Buenos Aires", "Kolkata", "Manille"
]

input_file = 'data.csv'       # Nom de ton fichier CSV original
output_file = 'data_modifie.csv'  # Nom du fichier CSV modifié

# Lecture et modification du CSV
with open(input_file, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    fieldnames = reader.fieldnames
    rows = []
    
    for row in reader:
        row['Location'] = random.choice(big_cities)
        rows.append(row)

# Écriture du CSV modifié
with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Fichier modifié enregistré sous '{output_file}'")
