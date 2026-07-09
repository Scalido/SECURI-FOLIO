-- Activation de l'extension uuid-ossp pour la génération des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Authentification & Rôles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('agent', 'chef_cadastre', 'conservateur', 'notaire', 'citoyen')),
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Active le RLS sur profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON profiles FOR SELECT USING (auth.uid() = id);

-- 2. TITRES FONCIERS (La table principale)
CREATE TABLE IF NOT EXISTS titres_fonciers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_cadastral VARCHAR(255) NOT NULL UNIQUE,
    volume VARCHAR(50) NOT NULL,
    folio VARCHAR(50) NOT NULL,
    nom_proprietaire VARCHAR(255) NOT NULL,
    circonscription VARCHAR(255) NOT NULL,
    superficie VARCHAR(100),
    date_enregistrement TIMESTAMP WITH TIME ZONE,
    statut VARCHAR(100) NOT NULL CHECK (statut IN ('Valide', 'Litige', 'Falsifié', 'En attente de validation cadastrale', 'Validé techniquement')),
    scan_url TEXT,
    coordonnees_spatiales JSONB,
    hash_signature VARCHAR(255), -- Empreinte SHA-256
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Active le RLS sur titres_fonciers
ALTER TABLE titres_fonciers ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les titres (pour le portail de vérification)
CREATE POLICY "Lecture publique des titres" ON titres_fonciers FOR SELECT USING (true);

-- Politique : Seuls les agents peuvent insérer ou modifier
CREATE POLICY "Agents peuvent insérer" ON titres_fonciers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'agent')
);
CREATE POLICY "Agents peuvent modifier" ON titres_fonciers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'agent')
);
CREATE POLICY "Chefs de cadastre peuvent modifier" ON titres_fonciers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'chef_cadastre')
);
CREATE POLICY "Conservateurs peuvent modifier" ON titres_fonciers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'conservateur')
);

-- 3. HISTORIQUE SMART ARCHIVE (Audit Trail)
CREATE TABLE IF NOT EXISTS smart_archive_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(id),
    numero_cadastral VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Active le RLS sur l'historique
ALTER TABLE smart_archive_history ENABLE ROW LEVEL SECURITY;

-- Politique : Un agent voit son historique
CREATE POLICY "Agents voient leur historique" ON smart_archive_history FOR SELECT USING (auth.uid() = agent_id);
-- Politique : Les agents peuvent insérer
CREATE POLICY "Agents peuvent insérer historique" ON smart_archive_history FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Fonction pour mettre à jour automatiquement "updated_at"
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_titres_fonciers_updated_at ON titres_fonciers;
CREATE TRIGGER update_titres_fonciers_updated_at
    BEFORE UPDATE ON titres_fonciers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
