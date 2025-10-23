-- Insert districts for Uttar Pradesh (without Hindi to avoid encoding issues)
INSERT INTO districts (state_id, district_code, district_name, latitude, longitude) VALUES 
    (1, 'UP-AGR', 'Agra', 27.1767, 78.0081),
    (1, 'UP-ALL', 'Allahabad', 25.4358, 81.8463),
    (1, 'UP-LKO', 'Lucknow', 26.8467, 80.9462),
    (1, 'UP-VNS', 'Varanasi', 25.3176, 82.9739),
    (1, 'UP-KNP', 'Kanpur', 26.4499, 80.3319),
    (1, 'UP-GZB', 'Ghaziabad', 28.6692, 77.4538),
    (1, 'UP-MRT', 'Meerut', 28.9845, 77.7064),
    (1, 'UP-BLY', 'Bareilly', 28.3670, 79.4304),
    (1, 'UP-ALG', 'Aligarh', 27.8974, 78.0880),
    (1, 'UP-MRD', 'Moradabad', 28.8389, 78.7768),
    (1, 'UP-SHJ', 'Shahjahanpur', 27.8802, 79.9050),
    (1, 'UP-RBR', 'Rae Bareli', 26.2307, 81.2506),
    (1, 'UP-JNP', 'Jaunpur', 25.7461, 82.6847),
    (1, 'UP-BDN', 'Budaun', 28.0416, 79.1240),
    (1, 'UP-RMP', 'Rampur', 28.8115, 79.0252),
    (1, 'UP-GZP', 'Ghazipur', 25.5882, 83.5782),
    (1, 'UP-AZM', 'Azamgarh', 26.0673, 83.1849),
    (1, 'UP-BLP', 'Ballia', 25.7580, 84.1497),
    (1, 'UP-MNJ', 'Mainpuri', 27.2351, 79.0270),
    (1, 'UP-GOR', 'Gorakhpur', 26.7606, 83.3732)
ON CONFLICT (district_code) DO NOTHING;
