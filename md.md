# Outil de Sauvegarde et de Restauration de Base de Données

## Présentation du Projet
Ce projet est un **Outil de Sauvegarde et de Restauration de Base de Données** pour gestion des bases de données MySQL avec interface web.

## Fonctionnalités
- **Sauvegarde des Bases de Données** : Les utilisateurs peuvent sélectionner une ou plusieurs bases de données à sauvegarder.
- **Restauration des Bases de Données** : Les utilisateurs peuvent restaurer des bases de données précédemment sauvegardées.
- **Affichage des Bases de Données** : L'outil récupère et affiche toutes les bases de données disponibles sur le serveur MySQL, en excluant les bases de données système.

## Technologie Utilisée
- **Node.js** : Le backend est avec Node.js, offrant un environnement robuste.
- **Fastify** : Utilisé pour créer le serveur web et gérer les requêtes API.
- **MySQL2** : La bibliothèque MySQL2 avec une interaction fluide avec la base de données MySQL.
- **HTML/CSS** : L'interface avec HTML et CSS pour une expérience utilisateur.
- **API Slack** : Intégrée pour envoyer des notifications sur les processus de sauvegarde et de restauration.
- **Zlib** : Utilisé pour compresser les fichiers de sauvegarde afin d'économiser de l'espace de stockage.

## Structure du Répertoire

## Fonctionnement
1. L'utilisateur sélectionne des bases de données depuis l'interface frontale.
2. Le backend traite la requête pour sauvegarder ou restaurer les bases de données sélectionnées à l'aide de commandes MySQL.
3. Le système fournit des retours via des notifications Slack pour le succès ou l'échec de chaque opération.

## Conclusion
Cet outil améliore l'efficacité de la gestion des bases de données en automatisant les processus de sauvegarde et de restauration, minimisant ainsi le risque de perte de données.
