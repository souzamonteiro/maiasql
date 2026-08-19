SELECT 1 + 2 * 3, (1 + 2) * 3, 8 | 4 & 2, -name COLLATE nocase
FROM people
WHERE age BETWEEN 18 AND 65 AND active = TRUE;
