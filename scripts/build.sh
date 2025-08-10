#!/bin/bash

# Chemin vers le dossier contenant les instances
INSTANCES_DIR="./maps"

# Vérifie si le dossier des instances existe
if [ ! -d "$INSTANCES_DIR" ]; then
  echo "Erreur : Le dossier $INSTANCES_DIR n'existe pas."
  exit 1
fi

# Liste les sous-dossiers dans le dossier instances
APPS=($(ls -d "$INSTANCES_DIR"/*/ 2>/dev/null | xargs -n 1 basename))

# Vérifie s'il y a des applications disponibles
if [ ${#APPS[@]} -eq 0 ]; then
  echo "Aucune application trouvée dans $INSTANCES_DIR."
  exit 1
fi

# Vérifie si un argument --app est fourni
if [[ "$1" == "--app" && -n "$2" ]]; then
  APP="$2"
else
  # Affiche un menu interactif avec fzf si aucun argument --app n'est fourni
  echo "Veuillez sélectionner une application à lancer :"
  APP=$(printf "%s\n" "${APPS[@]}" | fzf --height 10 --border --prompt="Choisissez une application : ")

  # Vérifie si une application a été sélectionnée
  if [ -z "$APP" ]; then
    echo "Aucune application sélectionnée. Abandon."
    exit 1
  fi
fi

APP_DIR="$INSTANCES_DIR/$APP"

# Vérifie si le dossier de l'application sélectionnée existe
if [ ! -d "$APP_DIR" ]; then
  echo "Erreur : Le dossier $APP_DIR n'existe pas."
  exit 1
fi

# Lancer l'application avec yarn
echo "Construction des tiles : $APP..."
node ./scripts/build.mjs $APP
