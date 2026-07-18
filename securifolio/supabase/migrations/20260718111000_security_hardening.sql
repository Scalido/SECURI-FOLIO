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
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS circonscription VARCHAR(255);
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON profiles;
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

-- Politique : lecture complète réservée aux comptes authentifiés autorisés.
-- Le portail public doit passer par une API serveur qui ne retourne qu'un résumé filtré.
DROP POLICY IF EXISTS "Lecture publique des titres" ON titres_fonciers;
DROP POLICY IF EXISTS "Acteurs authentifiés peuvent lire les titres" ON titres_fonciers;
CREATE POLICY "Acteurs authentifiés peuvent lire les titres" ON titres_fonciers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('agent', 'chef_cadastre', 'conservateur', 'notaire')
        AND (profiles.circonscription IS NULL OR profiles.circonscription = titres_fonciers.circonscription)
    )
);

-- Politique : Seuls les agents peuvent insérer ou modifier
DROP POLICY IF EXISTS "Agents peuvent insérer" ON titres_fonciers;
CREATE POLICY "Agents peuvent insérer" ON titres_fonciers FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'agent'
        AND (profiles.circonscription IS NULL OR profiles.circonscription = titres_fonciers.circonscription)
    )
);
DROP POLICY IF EXISTS "Agents peuvent modifier" ON titres_fonciers;
CREATE POLICY "Agents peuvent modifier" ON titres_fonciers FOR UPDATE USING (
    false
);
DROP POLICY IF EXISTS "Chefs de cadastre peuvent modifier" ON titres_fonciers;
CREATE POLICY "Chefs de cadastre peuvent modifier" ON titres_fonciers FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'chef_cadastre'
        AND (profiles.circonscription IS NULL OR profiles.circonscription = titres_fonciers.circonscription)
    )
);
DROP POLICY IF EXISTS "Conservateurs peuvent modifier" ON titres_fonciers;
CREATE POLICY "Conservateurs peuvent modifier" ON titres_fonciers FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'conservateur'
        AND (profiles.circonscription IS NULL OR profiles.circonscription = titres_fonciers.circonscription)
    )
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
DROP POLICY IF EXISTS "Agents voient leur historique" ON smart_archive_history;
CREATE POLICY "Agents voient leur historique" ON smart_archive_history FOR SELECT USING (auth.uid() = agent_id);
-- Politique : Les agents peuvent insérer
DROP POLICY IF EXISTS "Agents peuvent insérer historique" ON smart_archive_history;
CREATE POLICY "Agents peuvent insérer historique" ON smart_archive_history FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- 4. HISTORIQUE ANTI-FOLIO
CREATE TABLE IF NOT EXISTS anti_folio_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(id),
    numero_cadastral VARCHAR(255) NOT NULL,
    resultat VARCHAR(20) NOT NULL CHECK (resultat IN ('valid', 'fraud', 'pending')),
    date_scan TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE anti_folio_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents voient leur historique anti-folio" ON anti_folio_history;
DROP POLICY IF EXISTS "Agents insèrent leur historique anti-folio" ON anti_folio_history;
CREATE POLICY "Agents voient leur historique anti-folio" ON anti_folio_history FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents insèrent leur historique anti-folio" ON anti_folio_history FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Verrou append-only explicite pour les historiques.
CREATE OR REPLACE FUNCTION prevent_history_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Les journaux d''audit sont append-only et ne peuvent pas être modifiés ou supprimés.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_smart_archive_history_mutation ON smart_archive_history;
CREATE TRIGGER prevent_smart_archive_history_mutation
    BEFORE UPDATE OR DELETE ON smart_archive_history
    FOR EACH ROW
    EXECUTE FUNCTION prevent_history_mutation();

DROP TRIGGER IF EXISTS prevent_anti_folio_history_mutation ON anti_folio_history;
CREATE TRIGGER prevent_anti_folio_history_mutation
    BEFORE UPDATE OR DELETE ON anti_folio_history
    FOR EACH ROW
    EXECUTE FUNCTION prevent_history_mutation();

-- 5. FONCTIONS TRANSACTIONNELLES MÉTIER
CREATE OR REPLACE FUNCTION create_title_with_history(
    p_numero_cadastral VARCHAR,
    p_nom_proprietaire VARCHAR,
    p_volume VARCHAR,
    p_folio VARCHAR,
    p_circonscription VARCHAR,
    p_superficie VARCHAR,
    p_date_enregistrement TIMESTAMP WITH TIME ZONE,
    p_scan_url TEXT,
    p_coordonnees_spatiales JSONB,
    p_hash_signature VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_profile profiles%ROWTYPE;
    v_title_id UUID;
BEGIN
    SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();

    IF v_profile.id IS NULL OR v_profile.role <> 'agent' THEN
        RAISE EXCEPTION 'Accès réservé aux agents assermentés.';
    END IF;

    IF v_profile.circonscription IS NOT NULL AND v_profile.circonscription <> p_circonscription THEN
        RAISE EXCEPTION 'Circonscription non autorisée pour cet agent.';
    END IF;

    INSERT INTO titres_fonciers (
        numero_cadastral,
        nom_proprietaire,
        volume,
        folio,
        circonscription,
        superficie,
        date_enregistrement,
        statut,
        scan_url,
        coordonnees_spatiales,
        hash_signature
    )
    VALUES (
        p_numero_cadastral,
        p_nom_proprietaire,
        COALESCE(p_volume, ''),
        COALESCE(p_folio, ''),
        p_circonscription,
        COALESCE(p_superficie, ''),
        p_date_enregistrement,
        'En attente de validation cadastrale',
        p_scan_url,
        p_coordonnees_spatiales,
        p_hash_signature
    )
    RETURNING id INTO v_title_id;

    INSERT INTO smart_archive_history (agent_id, numero_cadastral, action_type)
    VALUES (auth.uid(), p_numero_cadastral, 'insert');

    RETURN v_title_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_title_status_with_history(
    p_title_id UUID,
    p_new_status VARCHAR,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_profile profiles%ROWTYPE;
    v_title titres_fonciers%ROWTYPE;
    v_action_type VARCHAR;
BEGIN
    SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();

    IF v_profile.id IS NULL THEN
        RAISE EXCEPTION 'Non authentifié.';
    END IF;

    SELECT * INTO v_title FROM titres_fonciers WHERE id = p_title_id FOR UPDATE;

    IF v_title.id IS NULL THEN
        RAISE EXCEPTION 'Titre introuvable.';
    END IF;

    IF v_profile.circonscription IS NOT NULL AND v_profile.circonscription <> v_title.circonscription THEN
        RAISE EXCEPTION 'Circonscription non autorisée.';
    END IF;

    IF v_profile.role = 'chef_cadastre' THEN
        IF v_title.statut <> 'En attente de validation cadastrale'
           OR p_new_status NOT IN ('Validé techniquement', 'Falsifié', 'Litige') THEN
            RAISE EXCEPTION 'Transition cadastrale non autorisée.';
        END IF;
        v_action_type := CASE WHEN p_new_status = 'Validé techniquement' THEN 'approved_by_cadastre' ELSE 'rejected_by_cadastre' END;
    ELSIF v_profile.role = 'conservateur' THEN
        IF v_title.statut <> 'Validé techniquement'
           OR p_new_status NOT IN ('Valide', 'Falsifié') THEN
            RAISE EXCEPTION 'Transition conservateur non autorisée.';
        END IF;
        v_action_type := CASE WHEN p_new_status = 'Valide' THEN 'approved_by_conservateur' ELSE 'rejected_by_conservateur' END;
    ELSE
        RAISE EXCEPTION 'Rôle non autorisé pour modifier le statut.';
    END IF;

    UPDATE titres_fonciers
    SET statut = p_new_status
    WHERE id = p_title_id;

    INSERT INTO smart_archive_history (agent_id, numero_cadastral, action_type, notes)
    VALUES (auth.uid(), v_title.numero_cadastral, v_action_type, NULLIF(p_notes, ''));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
