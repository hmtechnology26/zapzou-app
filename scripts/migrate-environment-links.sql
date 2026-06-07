INSERT INTO service_environment_links (service_id, environment_id)
SELECT s.id, s.environment_id
FROM services s
LEFT JOIN service_environment_links sel ON s.id = sel.service_id
WHERE sel.service_id IS NULL
  AND s.environment_id IS NOT NULL;
