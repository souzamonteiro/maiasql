-- Operator precedence and associativity tests

SELECT 1 + 2 * 3;              -- 1 + (2 * 3)
SELECT (1 + 2) * 3;            -- explicit grouping
SELECT 10 - 3 - 2;             -- (10 - 3) - 2
SELECT 20 / 5 / 2;             -- (20 / 5) / 2
SELECT 'a' || 'b' * 2;         -- ('a' || 'b') * 2
SELECT 8 | 4 & 2;              -- ((8 | 4) & 2), same bitwise level
SELECT 8 >> 1 | 1;             -- ((8 >> 1) | 1)
SELECT ~-1;                    -- ~(-1)
SELECT -name COLLATE nocase FROM people;
SELECT age BETWEEN 18 AND 65 AND active FROM people;
SELECT NOT age BETWEEN 18 AND 65 AND active FROM people;
SELECT a = b = c FROM t;       -- left fold if accepted
SELECT a IS NOT NULL OR b IS NULL AND c FROM t;
