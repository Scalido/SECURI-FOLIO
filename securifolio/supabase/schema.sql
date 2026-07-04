-- Activation de l'extension uuid-ossp pour la génération des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création de la table titres_fonciers
CREATE TABLE IF NOT EXISTS titres_fonciers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_cadastral VARCHAR(255) NOT NULL,
    volume VARCHAR(50) NOT NULL,
    folio VARCHAR(50) NOT NULL,
    nom_proprietaire VARCHAR(255) NOT NULL,
    circonscription VARCHAR(255) NOT NULL,
    statut VARCHAR(50) NOT NULL CHECK (statut IN ('Valide', 'Litige', 'Falsifié')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertion de 10 fausses données réalistes de RDC
INSERT INTO titres_fonciers (id, numero_cadastral, volume, folio, nom_proprietaire, circonscription, statut)
VALUES 
    (uuid_generate_v4(), 'SU/GOM/1023', 'A120', '45', 'Jean-Claude Kalombo', 'Gombe', 'Valide'),
    (uuid_generate_v4(), 'SU/GOM/1024', 'A120', '46', 'Marie-Thérèse Ngalula', 'Gombe', 'Valide'),
    (uuid_generate_v4(), 'SU/INO/508', 'M45', '12', 'Albert Ilunga', 'Inongo', 'Valide'),
    (uuid_generate_v4(), 'SU/LUB/990', 'L89', '102', 'Entreprise Mining RDC', 'Lubumbashi', 'Valide'),
    (uuid_generate_v4(), 'SU/MAT/344', 'C23', '88', 'Sophie Mutombo', 'Matete', 'Valide'),
    (uuid_generate_v4(), 'SU/KIM/871', 'K11', '03', 'Pierre Kasongo', 'Kisenso', 'Litige'),
    (uuid_generate_v4(), 'SU/LIM/201', 'L33', '15', 'Fidèle Tshibangu', 'Limete', 'Valide'),
    (uuid_generate_v4(), 'SU/KAL/412', 'K09', '77', 'Association Ndako', 'Kalamu', 'Litige'),
    (uuid_generate_v4(), 'SU/GOM/1023', 'X999', '45', 'Faux Propriétaire 1', 'Gombe', 'Falsifié'),
    (uuid_generate_v4(), 'SU/INO/508', 'Y888', '12', 'Faux Propriétaire 2', 'Inongo', 'Falsifié');
