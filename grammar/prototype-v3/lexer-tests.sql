-- Lexer and keyword/identifier boundary tests

SELECT selector FROM selection;
select selector from selection;
SeLeCt selector FrOm selection;

SELECT selectValue, selected, selector2 FROM fromTable;
SELECT ordering, grouped, indexedColumn FROM indexes;
SELECT whereValue, havingValue, joinValue FROM names;

-- Exact keyword text used as identifiers must be quoted:
SELECT "select", [from], `where`
FROM "table";

-- Mixed case keywords:
CrEaTe TaBlE MixedCase (
  Id InTeGeR PrImArY KeY,
  Name TeXt NoT NuLl
);

InSeRt InTo MixedCase(Id, Name)
VaLuEs (1, 'Ada');

SeLeCt Id, Name
FrOm MixedCase
WhErE Id = 1;
