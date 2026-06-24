# Hypertube

Hypertube est une application web de streaming vidéo qui permet aux utilisateurs de rechercher et de visionner des vidéos directement via le protocole BitTorrent, sans attendre le téléchargement complet du fichier. Le projet repose sur une architecture découplée avec un client React, un serveur de streaming Node.js et une base de données PostgreSQL, le tout orchestré et conteneurisé avec Docker.

## Architecture et Technologies

### Client (Frontend)
- React 18 : Bibliothèque principale pour la construction de l'interface utilisateur.
- React Router DOM : Gestion des routes et de la navigation au sein de l'application.
- React Player : Lecteur vidéo intégré prenant en charge le streaming HTML5 standard et l'affichage des pistes de sous-titres.
- Axios : Client HTTP utilisé pour communiquer avec l'API backend.

### Serveur (Backend)
- Node.js et Express : Serveur d'API et moteur de streaming.
- torrent-stream : Module Node.js permettant de s'interfacer avec le protocole BitTorrent pour télécharger des morceaux de fichiers à la demande.
- JSON Web Tokens (JWT) et BcryptJS : Gestion sécurisée de l'authentification et du hachage des mots de passe.
- Nodemailer : Service d'envoi d'e-mails pour la validation de compte ou la réinitialisation de mot de passe.

### Base de Données
- PostgreSQL 15 : Base de données relationnelle pour stocker les profils utilisateurs, l'historique de lecture, les commentaires et les sources des films.

### Infrastructure et Déploiement
- Docker et Docker Compose : Conteneurisation des différents services (frontend, backend, base de données) assurant un environnement de développement identique et reproductible.

## Techniques Mises en Oeuvre

### 1. Streaming à la volée via BitTorrent
Le serveur utilise la bibliothèque torrent-stream pour initialiser un moteur de téléchargement à partir d'un lien magnet. Dès que les premiers morceaux indispensables du fichier vidéo sont téléchargés, le flux est envoyé au client en temps réel. Le système identifie automatiquement le fichier vidéo le plus volumineux au sein du torrent pour lancer le flux de visionnage approprié.

### 2. Gestion des Requêtes Partielles (HTTP 206 / Range Requests)
Pour offrir une expérience de lecture fluide, le backend implémente le support complet des requêtes de plage d'octets (HTTP Range Requests). Lorsqu'un utilisateur avance ou recule dans la timeline de la vidéo, le navigateur envoie un en-tête Range. Le serveur extrait alors précisément les octets correspondants dans le flux du torrent et répond avec un statut HTTP 206 (Partial Content). Cela évite de télécharger le fichier séquentiellement depuis le début.

### 3. Conversion Dynamique de Sous-titres (SRT vers VTT)
Les lecteurs vidéo HTML5 natifs nécessitent le format WebVTT (.vtt) pour afficher des sous-titres. Les torrents contenant souvent des sous-titres au format SubRip (.srt), le serveur implémente un convertisseur à la volée. Il lit le flux SRT, applique des expressions régulières pour adapter le formatage des horodatages et renvoie les données converties directement en flux text/vtt au lecteur client.

### 4. Gestion Intelligente des Ressources (Garbage Collector de Torrents)
Afin de ne pas saturer le stockage et la mémoire du serveur, un mécanisme de nettoyage périodique (enginesCleanup) est mis en place. Toutes les 30 secondes, le serveur vérifie l'inactivité des moteurs de torrent. Si un moteur n'a pas été sollicité pendant plus de 30 secondes, il est détruit et les ressources associées sont libérées.

### 5. Conception et Optimisation de la Base de Données
Le schéma SQL met en oeuvre des index stratégiques sur les colonnes fréquemment consultées comme email, username, titre de film ou identifiant utilisateur dans la liste de suivi. De plus, l'architecture prend en charge des fonctionnalités avancées comme la liaison de comptes tiers (OAuth via la table auth_providers) et le suivi précis de la progression de lecture de l'utilisateur (table watchlist).

## Compétences Acquises

La réalisation de ce projet permet de maîtriser plusieurs concepts fondamentaux en développement logiciel :
- Protocoles Réseau et P2P : Compréhension approfondie du protocole BitTorrent, de la gestion des pairs (peers), des seeds et des sangsues (leechers).
- Traitement de Flux de Données (Streams) : Manipulation des flux Node.js (ReadStream, pipe) pour transférer des données de manière efficace et asynchrone sans surcharger la mémoire vive.
- Gestion du Protocole HTTP : Implémentation fine des mécanismes de mise en cache, des statuts HTTP spécifiques comme le 206 Partial Content et de la négociation de contenu.
- Architecture et Conteneurisation : Modélisation d'une application multi-services avec Docker Compose, configuration de réseaux isolés et gestion de dépendances au démarrage des conteneurs (healthchecks).
- Optimisation SQL : Structuration de bases de données relationnelles complexes et indexation pour garantir des temps de réponse minimaux.

## Installation et Démarrage

### Prérequis
- Docker et Docker Compose installés sur votre machine.

### Instructions de Lancement
1. Dupliquez le fichier d'exemple des variables d'environnement :
   ```bash
   cp .env.example .env
   ```
2. Renseignez les variables nécessaires dans le fichier `.env`.
3. Lancez les conteneurs avec Docker Compose à l'aide du Makefile :
   ```bash
   make
   ```
   Cette commande va construire les images et démarrer le frontend sur le port 3000, le backend sur le port 5001, et la base de données PostgreSQL.

### Commandes Utiles du Makefile
- Démarrer les services : `make up`
- Arrêter les services : `make down`
- Nettoyer les volumes et réseaux : `make clean`
- Consulter les logs d'un service (ex. backend) : `make logs SERVICE=backend`
- Ouvrir un terminal dans un conteneur (ex. backend) : `make shell SERVICE=backend`
