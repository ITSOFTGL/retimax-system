-- Reparar usuarios demo sin username (despliegues parciales en Railway)
UPDATE "usuarios"
SET "username" = LOWER(SPLIT_PART("email", '@', 1))
WHERE "username" IS NULL OR TRIM("username") = '';
