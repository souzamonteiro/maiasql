INSERT INTO ledger (label, amount)
VALUES ('initial', 10);

BEGIN TRANSACTION;
SAVEPOINT add_more;
INSERT INTO ledger (label, amount)
VALUES ('rolled back', 20);
ROLLBACK TO SAVEPOINT add_more;
COMMIT;
