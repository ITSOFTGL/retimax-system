#!/bin/sh
set -eu

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

echo "[backup] Iniciando backup ${TIMESTAMP}"

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h postgres \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -F c \
  -f "$BACKUP_DIR/database.dump"

tar -czf "$BACKUP_DIR/uploads.tar.gz" -C /data uploads

if command -v openssl >/dev/null 2>&1; then
  tar -czf - -C "$BACKUP_DIR" . | \
    openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:"$BACKUP_PASSPHRASE" \
    -out "/backups/retimax_${TIMESTAMP}.tar.gz.enc"
  rm -rf "$BACKUP_DIR"
  echo "[backup] Backup cifrado creado: /backups/retimax_${TIMESTAMP}.tar.gz.enc"
else
  tar -czf "/backups/retimax_${TIMESTAMP}.tar.gz" -C "$BACKUP_DIR" .
  rm -rf "$BACKUP_DIR"
  echo "[backup] Backup creado: /backups/retimax_${TIMESTAMP}.tar.gz"
fi

find /backups -type f -mtime +14 -delete
echo "[backup] Limpieza de backups >14 días completada"
