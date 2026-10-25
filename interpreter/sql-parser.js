class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.tokens = [];
    this.charClassDepth = 0;
    this.templateDepth = 0;
    this.templateBraceDepthStack = [];
    this.tokenPatterns = [    { type: 'TOKEN__3B_', regex: /^;/ },    { type: 'TOKEN__2E_', regex: /^\./ },    { type: 'TOKEN__3D_', regex: /^=/ },    { type: 'TOKEN__28_', regex: /^\(/ },    { type: 'TOKEN__29_', regex: /^\)/ },    { type: 'TOKEN__2C_', regex: /^,/ },    { type: 'TOKEN__2B_', regex: /^\+/ },    { type: 'TOKEN__2D_', regex: /^-/ },    { type: 'TOKEN__2A_', regex: /^\*/ },    { type: 'TOKEN__2F_', regex: /^\// },    { type: 'TOKEN__25_', regex: /^%/ },    { type: 'TOKEN__3C_', regex: /^</ },    { type: 'TOKEN__3E_', regex: /^>/ },    { type: 'TOKEN__3C__3D_', regex: /^<=/ },    { type: 'TOKEN__3E__3D_', regex: /^>=/ },    { type: 'TOKEN__3C__3E_', regex: /^<>/ },    { type: 'TOKEN__21__3D_', regex: /^!=/ },    { type: 'TOKEN__7C__7C_', regex: /^\|\|/ },    { type: 'TOKEN__3A_', regex: /^:/ },    { type: 'TOKEN__40_', regex: /^@/ },    { type: 'TOKEN__24_', regex: /^\$/ },    { type: 'TOKEN__3D__3D_', regex: /^==/ },    { type: 'TOKEN__26_', regex: /^&/ },    { type: 'TOKEN__7C_', regex: /^\|/ },    { type: 'TOKEN__3C__3C_', regex: /^<</ },    { type: 'TOKEN__3E__3E_', regex: /^>>/ },    { type: 'TOKEN__2D__3E_', regex: /^->/ },    { type: 'TOKEN__2D__3E__3E_', regex: /^->>/ },    { type: 'TOKEN__7E_', regex: /^~/ },    { type: 'KW_SELECT', regex: /^[sS][eE][lL][eE][cC][tT]/ },    { type: 'KW_FROM', regex: /^[fF][rR][oO][mM]/ },    { type: 'KW_WHERE', regex: /^[wW][hH][eE][rR][eE]/ },    { type: 'KW_GROUP', regex: /^[gG][rR][oO][uU][pP]/ },    { type: 'KW_HAVING', regex: /^[hH][aA][vV][iI][nN][gG]/ },    { type: 'KW_ORDER', regex: /^[oO][rR][dD][eE][rR]/ },    { type: 'KW_BY', regex: /^[bB][yY]/ },    { type: 'KW_LIMIT', regex: /^[lL][iI][mM][iI][tT]/ },    { type: 'KW_OFFSET', regex: /^[oO][fF][fF][sS][eE][tT]/ },    { type: 'KW_DISTINCT', regex: /^[dD][iI][sS][tT][iI][nN][cC][tT]/ },    { type: 'KW_ALL', regex: /^[aA][lL][lL]/ },    { type: 'KW_AS', regex: /^[aA][sS]/ },    { type: 'KW_WINDOW', regex: /^[wW][iI][nN][dD][oO][wW]/ },    { type: 'KW_PARTITION', regex: /^[pP][aA][rR][tT][iI][tT][iI][oO][nN]/ },    { type: 'KW_OVER', regex: /^[oO][vV][eE][rR]/ },    { type: 'KW_FILTER', regex: /^[fF][iI][lL][tT][eE][rR]/ },    { type: 'KW_JOIN', regex: /^[jJ][oO][iI][nN]/ },    { type: 'KW_INNER', regex: /^[iI][nN][nN][eE][rR]/ },    { type: 'KW_LEFT', regex: /^[lL][eE][fF][tT]/ },    { type: 'KW_RIGHT', regex: /^[rR][iI][gG][hH][tT]/ },    { type: 'KW_FULL', regex: /^[fF][uU][lL][lL]/ },    { type: 'KW_OUTER', regex: /^[oO][uU][tT][eE][rR]/ },    { type: 'KW_CROSS', regex: /^[cC][rR][oO][sS][sS]/ },    { type: 'KW_NATURAL', regex: /^[nN][aA][tT][uU][rR][aA][lL]/ },    { type: 'KW_ON', regex: /^[oO][nN]/ },    { type: 'KW_USING', regex: /^[uU][sS][iI][nN][gG]/ },    { type: 'KW_INSERT', regex: /^[iI][nN][sS][eE][rR][tT]/ },    { type: 'KW_INTO', regex: /^[iI][nN][tT][oO]/ },    { type: 'KW_VALUES', regex: /^[vV][aA][lL][uU][eE][sS]/ },    { type: 'KW_UPDATE', regex: /^[uU][pP][dD][aA][tT][eE]/ },    { type: 'KW_SET', regex: /^[sS][eE][tT]/ },    { type: 'KW_DELETE', regex: /^[dD][eE][lL][eE][tT][eE]/ },    { type: 'KW_REPLACE', regex: /^[rR][eE][pP][lL][aA][cC][eE]/ },    { type: 'KW_RETURNING', regex: /^[rR][eE][tT][uU][rR][nN][iI][nN][gG]/ },    { type: 'KW_DO', regex: /^[dD][oO]/ },    { type: 'KW_NOTHING', regex: /^[nN][oO][tT][hH][iI][nN][gG]/ },    { type: 'KW_CONFLICT', regex: /^[cC][oO][nN][fF][lL][iI][cC][tT]/ },    { type: 'KW_CREATE', regex: /^[cC][rR][eE][aA][tT][eE]/ },    { type: 'KW_ALTER', regex: /^[aA][lL][tT][eE][rR]/ },    { type: 'KW_DROP', regex: /^[dD][rR][oO][pP]/ },    { type: 'KW_TABLE', regex: /^[tT][aA][bB][lL][eE]/ },    { type: 'KW_INDEX', regex: /^[iI][nN][dD][eE][xX]/ },    { type: 'KW_VIEW', regex: /^[vV][iI][eE][wW]/ },    { type: 'KW_TRIGGER', regex: /^[tT][rR][iI][gG][gG][eE][rR]/ },    { type: 'KW_VIRTUAL', regex: /^[vV][iI][rR][tT][uU][aA][lL]/ },    { type: 'KW_TEMP', regex: /^[tT][eE][mM][pP]/ },    { type: 'KW_TEMPORARY', regex: /^[tT][eE][mM][pP][oO][rR][aA][rR][yY]/ },    { type: 'KW_RENAME', regex: /^[rR][eE][nN][aA][mM][eE]/ },    { type: 'KW_COLUMN', regex: /^[cC][oO][lL][uU][mM][nN]/ },    { type: 'KW_ADD', regex: /^[aA][dD][dD]/ },    { type: 'KW_PRIMARY', regex: /^[pP][rR][iI][mM][aA][rR][yY]/ },    { type: 'KW_KEY', regex: /^[kK][eE][yY]/ },    { type: 'KW_UNIQUE', regex: /^[uU][nN][iI][qQ][uU][eE]/ },    { type: 'KW_CHECK', regex: /^[cC][hH][eE][cC][kK]/ },    { type: 'KW_DEFAULT', regex: /^[dD][eE][fF][aA][uU][lL][tT]/ },    { type: 'KW_COLLATE', regex: /^[cC][oO][lL][lL][aA][tT][eE]/ },    { type: 'KW_REFERENCES', regex: /^[rR][eE][fF][eE][rR][eE][nN][cC][eE][sS]/ },    { type: 'KW_FOREIGN', regex: /^[fF][oO][rR][eE][iI][gG][nN]/ },    { type: 'KW_AUTOINCREMENT', regex: /^[aA][uU][tT][oO][iI][nN][cC][rR][eE][mM][eE][nN][tT]/ },    { type: 'KW_CONSTRAINT', regex: /^[cC][oO][nN][sS][tT][rR][aA][iI][nN][tT]/ },    { type: 'KW_DEFERRABLE', regex: /^[dD][eE][fF][eE][rR][rR][aA][bB][lL][eE]/ },    { type: 'KW_INITIALLY', regex: /^[iI][nN][iI][tT][iI][aA][lL][lL][yY]/ },    { type: 'KW_DEFERRED', regex: /^[dD][eE][fF][eE][rR][rR][eE][dD]/ },    { type: 'KW_IMMEDIATE', regex: /^[iI][mM][mM][eE][dD][iI][aA][tT][eE]/ },    { type: 'KW_CASCADE', regex: /^[cC][aA][sS][cC][aA][dD][eE]/ },    { type: 'KW_RESTRICT', regex: /^[rR][eE][sS][tT][rR][iI][cC][tT]/ },    { type: 'KW_ACTION', regex: /^[aA][cC][tT][iI][oO][nN]/ },    { type: 'KW_GENERATED', regex: /^[gG][eE][nN][eE][rR][aA][tT][eE][dD]/ },    { type: 'KW_ALWAYS', regex: /^[aA][lL][wW][aA][yY][sS]/ },    { type: 'KW_STORED', regex: /^[sS][tT][oO][rR][eE][dD]/ },    { type: 'KW_STRICT', regex: /^[sS][tT][rR][iI][cC][tT]/ },    { type: 'KW_WITHOUT', regex: /^[wW][iI][tT][hH][oO][uU][tT]/ },    { type: 'KW_ROWID', regex: /^[rR][oO][wW][iI][dD]/ },    { type: 'KW_AND', regex: /^[aA][nN][dD]/ },    { type: 'KW_OR', regex: /^[oO][rR]/ },    { type: 'KW_NOT', regex: /^[nN][oO][tT]/ },    { type: 'KW_IS', regex: /^[iI][sS]/ },    { type: 'KW_NULL', regex: /^[nN][uU][lL][lL]/ },    { type: 'KW_ISNULL', regex: /^[iI][sS][nN][uU][lL][lL]/ },    { type: 'KW_NOTNULL', regex: /^[nN][oO][tT][nN][uU][lL][lL]/ },    { type: 'KW_BETWEEN', regex: /^[bB][eE][tT][wW][eE][eE][nN]/ },    { type: 'KW_IN', regex: /^[iI][nN]/ },    { type: 'KW_LIKE', regex: /^[lL][iI][kK][eE]/ },    { type: 'KW_GLOB', regex: /^[gG][lL][oO][bB]/ },    { type: 'KW_REGEXP', regex: /^[rR][eE][gG][eE][xX][pP]/ },    { type: 'KW_MATCH', regex: /^[mM][aA][tT][cC][hH]/ },    { type: 'KW_ESCAPE', regex: /^[eE][sS][cC][aA][pP][eE]/ },    { type: 'KW_EXISTS', regex: /^[eE][xX][iI][sS][tT][sS]/ },    { type: 'KW_TRUE', regex: /^[tT][rR][uU][eE]/ },    { type: 'KW_FALSE', regex: /^[fF][aA][lL][sS][eE]/ },    { type: 'KW_ANY', regex: /^[aA][nN][yY]/ },    { type: 'KW_SOME', regex: /^[sS][oO][mM][eE]/ },    { type: 'KW_CASE', regex: /^[cC][aA][sS][eE]/ },    { type: 'KW_WHEN', regex: /^[wW][hH][eE][nN]/ },    { type: 'KW_THEN', regex: /^[tT][hH][eE][nN]/ },    { type: 'KW_ELSE', regex: /^[eE][lL][sS][eE]/ },    { type: 'KW_END', regex: /^[eE][nN][dD]/ },    { type: 'KW_CAST', regex: /^[cC][aA][sS][tT]/ },    { type: 'KW_RAISE', regex: /^[rR][aA][iI][sS][eE]/ },    { type: 'KW_CURRENT_DATE', regex: /^[cC][uU][rR][rR][eE][nN][tT]_[dD][aA][tT][eE]/ },    { type: 'KW_CURRENT_TIME', regex: /^[cC][uU][rR][rR][eE][nN][tT]_[tT][iI][mM][eE]/ },    { type: 'KW_CURRENT_TIMESTAMP', regex: /^[cC][uU][rR][rR][eE][nN][tT]_[tT][iI][mM][eE][sS][tT][aA][mM][pP]/ },    { type: 'KW_BEGIN', regex: /^[bB][eE][gG][iI][nN]/ },    { type: 'KW_COMMIT', regex: /^[cC][oO][mM][mM][iI][tT]/ },    { type: 'KW_ROLLBACK', regex: /^[rR][oO][lL][lL][bB][aA][cC][kK]/ },    { type: 'KW_SAVEPOINT', regex: /^[sS][aA][vV][eE][pP][oO][iI][nN][tT]/ },    { type: 'KW_RELEASE', regex: /^[rR][eE][lL][eE][aA][sS][eE]/ },    { type: 'KW_TRANSACTION', regex: /^[tT][rR][aA][nN][sS][aA][cC][tT][iI][oO][nN]/ },    { type: 'KW_EXCLUSIVE', regex: /^[eE][xX][cC][lL][uU][sS][iI][vV][eE]/ },    { type: 'KW_PRAGMA', regex: /^[pP][rR][aA][gG][mM][aA]/ },    { type: 'KW_VACUUM', regex: /^[vV][aA][cC][uU][uU][mM]/ },    { type: 'KW_ANALYZE', regex: /^[aA][nN][aA][lL][yY][zZ][eE]/ },    { type: 'KW_REINDEX', regex: /^[rR][eE][iI][nN][dD][eE][xX]/ },    { type: 'KW_ATTACH', regex: /^[aA][tT][tT][aA][cC][hH]/ },    { type: 'KW_DETACH', regex: /^[dD][eE][tT][aA][cC][hH]/ },    { type: 'KW_DATABASE', regex: /^[dD][aA][tT][aA][bB][aA][sS][eE]/ },    { type: 'KW_EXPLAIN', regex: /^[eE][xX][pP][lL][aA][iI][nN]/ },    { type: 'KW_QUERY', regex: /^[qQ][uU][eE][rR][yY]/ },    { type: 'KW_PLAN', regex: /^[pP][lL][aA][nN]/ },    { type: 'KW_ROWS', regex: /^[rR][oO][wW][sS]/ },    { type: 'KW_RANGE', regex: /^[rR][aA][nN][gG][eE]/ },    { type: 'KW_GROUPS', regex: /^[gG][rR][oO][uU][pP][sS]/ },    { type: 'KW_UNBOUNDED', regex: /^[uU][nN][bB][oO][uU][nN][dD][eE][dD]/ },    { type: 'KW_PRECEDING', regex: /^[pP][rR][eE][cC][eE][dD][iI][nN][gG]/ },    { type: 'KW_FOLLOWING', regex: /^[fF][oO][lL][lL][oO][wW][iI][nN][gG]/ },    { type: 'KW_CURRENT', regex: /^[cC][uU][rR][rR][eE][nN][tT]/ },    { type: 'KW_ROW', regex: /^[rR][oO][wW]/ },    { type: 'KW_EXCLUDE', regex: /^[eE][xX][cC][lL][uU][dD][eE]/ },    { type: 'KW_NO', regex: /^[nN][oO]/ },    { type: 'KW_OTHERS', regex: /^[oO][tT][hH][eE][rR][sS]/ },    { type: 'KW_TIES', regex: /^[tT][iI][eE][sS]/ },    { type: 'KW_FIRST', regex: /^[fF][iI][rR][sS][tT]/ },    { type: 'KW_LAST', regex: /^[lL][aA][sS][tT]/ },    { type: 'KW_NULLS', regex: /^[nN][uU][lL][lL][sS]/ },    { type: 'KW_ABORT', regex: /^[aA][bB][oO][rR][tT]/ },    { type: 'KW_AFTER', regex: /^[aA][fF][tT][eE][rR]/ },    { type: 'KW_ASC', regex: /^[aA][sS][cC]/ },    { type: 'KW_BEFORE', regex: /^[bB][eE][fF][oO][rR][eE]/ },    { type: 'KW_BIG', regex: /^[bB][iI][gG]/ },    { type: 'KW_BIGINT', regex: /^[bB][iI][gG][iI][nN][tT]/ },    { type: 'KW_BINARY', regex: /^[bB][iI][nN][aA][rR][yY]/ },    { type: 'KW_BIT', regex: /^[bB][iI][tT]/ },    { type: 'KW_BLOB', regex: /^[bB][lL][oO][bB]/ },    { type: 'KW_BOOLEAN', regex: /^[bB][oO][oO][lL][eE][aA][nN]/ },    { type: 'KW_CHAR', regex: /^[cC][hH][aA][rR]/ },    { type: 'KW_CHARACTER', regex: /^[cC][hH][aA][rR][aA][cC][tT][eE][rR]/ },    { type: 'KW_CLOB', regex: /^[cC][lL][oO][bB]/ },    { type: 'KW_DATE', regex: /^[dD][aA][tT][eE]/ },    { type: 'KW_DATETIME', regex: /^[dD][aA][tT][eE][tT][iI][mM][eE]/ },    { type: 'KW_DECIMAL', regex: /^[dD][eE][cC][iI][mM][aA][lL]/ },    { type: 'KW_DESC', regex: /^[dD][eE][sS][cC]/ },    { type: 'KW_DOUBLE', regex: /^[dD][oO][uU][bB][lL][eE]/ },    { type: 'KW_EACH', regex: /^[eE][aA][cC][hH]/ },    { type: 'KW_EXCEPT', regex: /^[eE][xX][cC][eE][pP][tT]/ },    { type: 'KW_FAIL', regex: /^[fF][aA][iI][lL]/ },    { type: 'KW_FLOAT', regex: /^[fF][lL][oO][aA][tT]/ },    { type: 'KW_FOR', regex: /^[fF][oO][rR]/ },    { type: 'KW_IF', regex: /^[iI][fF]/ },    { type: 'KW_IGNORE', regex: /^[iI][gG][nN][oO][rR][eE]/ },    { type: 'KW_INDEXED', regex: /^[iI][nN][dD][eE][xX][eE][dD]/ },    { type: 'KW_INSTEAD', regex: /^[iI][nN][sS][tT][eE][aA][dD]/ },    { type: 'KW_INT', regex: /^[iI][nN][tT]/ },    { type: 'KW_INTEGER', regex: /^[iI][nN][tT][eE][gG][eE][rR]/ },    { type: 'KW_INTERSECT', regex: /^[iI][nN][tT][eE][rR][sS][eE][cC][tT]/ },    { type: 'KW_MATERIALIZED', regex: /^[mM][aA][tT][eE][rR][iI][aA][lL][iI][zZ][eE][dD]/ },    { type: 'KW_MEDIUMINT', regex: /^[mM][eE][dD][iI][uU][mM][iI][nN][tT]/ },    { type: 'KW_NATIONAL', regex: /^[nN][aA][tT][iI][oO][nN][aA][lL]/ },    { type: 'KW_NATIVE', regex: /^[nN][aA][tT][iI][vV][eE]/ },    { type: 'KW_NCHAR', regex: /^[nN][cC][hH][aA][rR]/ },    { type: 'KW_NUMERIC', regex: /^[nN][uU][mM][eE][rR][iI][cC]/ },    { type: 'KW_NVARCHAR', regex: /^[nN][vV][aA][rR][cC][hH][aA][rR]/ },    { type: 'KW_OF', regex: /^[oO][fF]/ },    { type: 'KW_OFF', regex: /^[oO][fF][fF]/ },    { type: 'KW_PRECISION', regex: /^[pP][rR][eE][cC][iI][sS][iI][oO][nN]/ },    { type: 'KW_REAL', regex: /^[rR][eE][aA][lL]/ },    { type: 'KW_RECURSIVE', regex: /^[rR][eE][cC][uU][rR][sS][iI][vV][eE]/ },    { type: 'KW_SMALLINT', regex: /^[sS][mM][aA][lL][lL][iI][nN][tT]/ },    { type: 'KW_TEXT', regex: /^[tT][eE][xX][tT]/ },    { type: 'KW_TIME', regex: /^[tT][iI][mM][eE]/ },    { type: 'KW_TIMESTAMP', regex: /^[tT][iI][mM][eE][sS][tT][aA][mM][pP]/ },    { type: 'KW_TINYINT', regex: /^[tT][iI][nN][yY][iI][nN][tT]/ },    { type: 'KW_TO', regex: /^[tT][oO]/ },    { type: 'KW_UNION', regex: /^[uU][nN][iI][oO][nN]/ },    { type: 'KW_UNSIGNED', regex: /^[uU][nN][sS][iI][gG][nN][eE][dD]/ },    { type: 'KW_VARBINARY', regex: /^[vV][aA][rR][bB][iI][nN][aA][rR][yY]/ },    { type: 'KW_VARCHAR', regex: /^[vV][aA][rR][cC][hH][aA][rR]/ },    { type: 'KW_VARYING', regex: /^[vV][aA][rR][yY][iI][nN][gG]/ },    { type: 'KW_WITH', regex: /^[wW][iI][tT][hH]/ },    { type: 'KW_YES', regex: /^[yY][eE][sS]/ },    { type: 'skip', regex: /^(?:(?:(?:[\u0009\u000a\u000d ])+|--(?:(?:\u0009|[\u0020-\ud7ff]|[\ue000-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udbfe][\udc00-\udfff]|[\udbff][\udc00-\udfff])))*(?:(?:\u000a|\u000d|\u000d\u000a)|(?![\s\S]))|\/\*(?:(?:(?:[^*])|(?:\*(?:[^/]))))*\*\/))+/, skip: true },    { type: 'Identifier', regex: /^(?:(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udbfe][\udc00-\udfff]|[\udbff][\udc00-\udfff]))(?:(?:(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udbfe][\udc00-\udfff]|[\udbff][\udc00-\udfff]))|[0-9]|\$))*|"(?:(?:""|(?:[^"])))*"|\[(?:[^\]])*\]|`(?:(?:``|(?:[^`])))*`)/ },    { type: 'StringLiteral', regex: /^'(?:(?:''|(?:[^'])))*'/ },    { type: 'BlobLiteral', regex: /^(?:X|x)'(?:[0-9A-Fa-f])*'/ },    { type: 'NumericLiteral', regex: /^(?:0(?:X|x)(?:[0-9A-Fa-f])+|(?:(?:[0-9])+(?:(?:\.(?:[0-9])*))?(?:(?:E|e)(?:(?:\+|-))?(?:[0-9])+)?|\.(?:[0-9])+(?:(?:E|e)(?:(?:\+|-))?(?:[0-9])+)?))/ },    { type: 'BindParameter', regex: /^(?:\?|\?(?:[0-9])+|(?::|@|\$)(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udbfe][\udc00-\udfff]|[\udbff][\udc00-\udfff]))(?:(?:(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udbfe][\udc00-\udfff]|[\udbff][\udc00-\udfff]))|[0-9]|\$))*|\$(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udbfe][\udc00-\udfff]|[\udbff][\udc00-\udfff]))(?:(?:(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udbfe][\udc00-\udfff]|[\udbff][\udc00-\udfff]))|[0-9]|\$))*::(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udbfe][\udc00-\udfff]|[\udbff][\udc00-\udfff]))(?:(?:(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udbfe][\udc00-\udfff]|[\udbff][\udc00-\udfff]))|[0-9]|\$))*(?:(?:\((?:[^)])*\)))?)/ },    ];
  }

  isTemplateSpanPattern(pos, kind) {
    // Deterministic scan to avoid regex escaping issues in generated code.
    if (this.input[pos] !== '}') return false;
    const BACKTICK = String.fromCharCode(96);
    const max = Math.min(this.input.length, pos + 256);
    let i = pos + 1;
    while (i < max) {
      const ch = this.input[i];
      const next = this.input[i + 1];

      if (ch === '\\') {
        i += 2;
        continue;
      }

      if (ch === '$' && next === '{') {
        return kind === 'TemplateMiddle';
      }

      if (ch === BACKTICK) {
        return kind === 'TemplateTail';
      }

      i++;
    }
    return false;
  }

  enterTemplateSpan() {
    this.templateDepth++;
    this.templateBraceDepthStack.push(0);
  }

  exitTemplateSpan() {
    if (this.templateDepth > 0) {
      this.templateDepth--;
    }
    if (this.templateBraceDepthStack.length > 0) {
      this.templateBraceDepthStack.pop();
    }
  }

  currentTemplateBraceDepth() {
    return this.templateBraceDepthStack.length === 0
      ? 0
      : this.templateBraceDepthStack[this.templateBraceDepthStack.length - 1];
  }

  incrementTemplateBraceDepth() {
    if (this.templateBraceDepthStack.length > 0) {
      this.templateBraceDepthStack[this.templateBraceDepthStack.length - 1] += 1;
    }
  }

  decrementTemplateBraceDepth() {
    const index = this.templateBraceDepthStack.length - 1;
    if (index >= 0 && this.templateBraceDepthStack[index] > 0) {
      this.templateBraceDepthStack[index] -= 1;
    }
  }
  
  tokenize() {
    while (this.position < this.input.length) {
      let bestPattern = null;
      let bestMatch = null;
      const candidates = [];

      const isGenericNameType = (type) => (
        type === 'Name' || type === 'NameChar' || type === 'NameStartChar'
      );

      for (const pattern of this.tokenPatterns) {
        // Template spans are synthesized only when a closing brace ends the
        // active interpolation. Their raw patterns must not consume ordinary
        // braces from nested expressions.
        if (pattern.type === 'TemplateMiddle' || pattern.type === 'TemplateTail') {
          continue;
        }

        const regex = pattern.regex;
        const match = this.input.substring(this.position).match(regex);

        if (match && match.index === 0 && match[0].length > 0) {
          let effectivePattern = pattern;
          let effectiveMatch = match;
          // When parsing template expressions, disambiguate closing brace as template span boundary.
          if (this.templateDepth > 0
            && pattern.type === 'TOKEN__7D_'
            && this.currentTemplateBraceDepth() === 0) {
            if (this.isTemplateSpanPattern(this.position, 'TemplateMiddle')) {
              const templateMiddle = this.tokenPatterns.find((candidate) => candidate.type === 'TemplateMiddle');
              const templateMatch = templateMiddle
                ? this.input.substring(this.position).match(templateMiddle.regex)
                : null;
              if (templateMatch && templateMatch.index === 0 && templateMatch[0].length > 0) {
                effectivePattern = templateMiddle;
                effectiveMatch = templateMatch;
              }
            } else if (this.isTemplateSpanPattern(this.position, 'TemplateTail')) {
              const templateTail = this.tokenPatterns.find((candidate) => candidate.type === 'TemplateTail');
              const templateMatch = templateTail
                ? this.input.substring(this.position).match(templateTail.regex)
                : null;
              if (templateMatch && templateMatch.index === 0 && templateMatch[0].length > 0) {
                effectivePattern = templateTail;
                effectiveMatch = templateMatch;
              }
            }
          }

          candidates.push({ pattern: effectivePattern, match: effectiveMatch });
          if (!bestMatch
              || effectiveMatch[0].length > bestMatch[0].length
              || (effectiveMatch[0].length === bestMatch[0].length && effectivePattern.skip && !bestPattern.skip)
              || (effectiveMatch[0].length === bestMatch[0].length
                  && bestPattern
                  && isGenericNameType(bestPattern.type)
                  && !isGenericNameType(effectivePattern.type))) {
            bestPattern = effectivePattern;
            bestMatch = effectiveMatch;
          }
        }
      }

      // Inside character classes, prefer Char/CharCode/CharRange-like tokens
      // over generic global terminals such as '?>' that can overmatch.
      if (this.charClassDepth > 0 && candidates.length > 0) {
        const preferredTypes = new Set(['CharCodeRange', 'CharRange', 'CharCode', 'Char', 'TOKEN__5D_']);
        const preferred = candidates.filter(c => preferredTypes.has(c.pattern.type));
        if (preferred.length > 0) {
          let localBest = preferred[0];
          for (const c of preferred) {
            if (c.match[0].length > localBest.match[0].length) {
              localBest = c;
            }
          }
          bestPattern = localBest.pattern;
          bestMatch = localBest.match;
        }
      }

      // If current input starts with whitespace and a skip token is available,
      // prefer skipping whitespace first instead of consuming it as grammar data.
      if (candidates.length > 0 && /^\s/.test(this.input.substring(this.position, this.position + 1))) {
        const skipCandidates = candidates.filter(c => c.pattern.skip);
        if (skipCandidates.length > 0) {
          let localBest = skipCandidates[0];
          for (const c of skipCandidates) {
            if (c.match[0].length > localBest.match[0].length) {
              localBest = c;
            }
          }
          bestPattern = localBest.pattern;
          bestMatch = localBest.match;
        }
      }

      if (!bestMatch) {
        throw new Error(`Unexpected character at position ${this.position}: '${this.input[this.position]}'`);
      }

      if (!bestPattern.skip) {
        const matchedToken = {
          type: bestPattern.type,
          value: bestMatch[0],
          start: this.position,
          end: this.position + bestMatch[0].length
        };
        this.tokens.push(matchedToken);

        if (bestPattern.type === 'TOKEN__5B_' || bestPattern.type === 'TOKEN__5B__5E_') {
          this.charClassDepth++;
        } else if (bestPattern.type === 'TOKEN__5D_' && this.charClassDepth > 0) {
          this.charClassDepth--;
        } else if (bestPattern.type === 'TOKEN__7B_' && this.templateDepth > 0) {
          this.incrementTemplateBraceDepth();
        } else if (bestPattern.type === 'TOKEN__7D_' && this.templateDepth > 0) {
          this.decrementTemplateBraceDepth();
        } else if (bestPattern.type === 'TemplateHead') {
          this.enterTemplateSpan();
        } else if (bestPattern.type === 'TemplateTail') {
          this.exitTemplateSpan();
        }
      }

      this.position += bestMatch[0].length;
    }
    
    // Add EOF token
    this.tokens.push({
      type: 'EOF',
      value: '',
      start: this.position,
      end: this.position
    });
    
    return this.tokens;
  }
}

class Parser {
  constructor(input, eventHandler = null) {
    this.lexer = new Lexer(input);
    this.tokens = this.lexer.tokenize();
    this.position = 0;
    this.errors = [];
    this.eventHandler = eventHandler;
    this.failureMemo = new Set();
  }
  
  peek(offset = 0) {
    return this.tokens[this.position + offset];
  }
  
  consume(expectedType) {
    const token = this.peek();
    if (!token || token.type !== expectedType) {
      this.errors.push({
        expected: expectedType,
        found: token ? token.type : 'EOF',
        position: this.position
      });
      throw new Error(`Expected '${expectedType}', got '${token ? token.type : 'EOF'}'`);
    }
    if (this.eventHandler && typeof this.eventHandler.terminal === 'function') {
      this.eventHandler.terminal(expectedType, token.value, this.position);
    }
    this.position++;
    return token;
  }
  
  match(expectedType) {
    const token = this.peek();
    if (token && token.type === expectedType) {
      if (this.eventHandler && typeof this.eventHandler.terminal === 'function') {
        this.eventHandler.terminal(expectedType, token.value, this.position);
      }
      this.position++;
      return true;
    }
    return false;
  }

  consumeContextual(expectedType) {
    const token = this.peek();
    if (token && token.type === expectedType) {
      return this.consume(expectedType);
    }

    const pattern = this.lexer.tokenPatterns.find((candidate) => candidate.type === expectedType);
    const match = pattern && token ? token.value.match(pattern.regex) : null;
    if (!match || match.index !== 0 || match[0].length !== token.value.length) {
      this.errors.push({
        expected: expectedType,
        found: token ? token.type : 'EOF',
        position: this.position
      });
      throw new Error('Expected contextual ' + expectedType + ', got ' + (token ? token.type : 'EOF'));
    }

    if (this.eventHandler && typeof this.eventHandler.terminal === 'function') {
      this.eventHandler.terminal(token.type, token.value, this.position);
    }
    this.position++;
    return token;
  }

  markEventState() {
    if (this.eventHandler && typeof this.eventHandler.checkpoint === 'function') {
      return this.eventHandler.checkpoint();
    }
    return null;
  }

  restoreEventState(mark) {
    if (mark !== null && this.eventHandler && typeof this.eventHandler.restore === 'function') {
      this.eventHandler.restore(mark);
    }
  }
  
  getErrorMessage() {
    if (this.errors.length === 0) return 'No errors';
    const err = this.errors[0];
    return `Syntax error: expected ${err.expected}, got ${err.found}`;
  }
  parse() {
    const result = this.parseSqlScript();
    const next = this.peek();
    if (!next && this.position === this.tokens.length) {
      return result;
    }
    if (!next || next.type !== 'EOF') {
      throw new Error(`Unexpected token at end: ${next ? next.type : 'EOF(consumed)'}`);
    }
    return result;
  }
  parseSqlScript() {
    const __memoStart = this.position;
    const __memoKey = 'SqlScript@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule SqlScript at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SqlScript', this.position);
    }
    let __ok = false;
    try {
    while (this.match('TOKEN__3B_')) { /* zero or more matched */ }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.parseSqlStatement();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__3B_');
    while (this.match('TOKEN__3B_')) { /* zero or more matched */ }
    this.parseSqlStatement();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    while (this.match('TOKEN__3B_')) { /* zero or more matched */ }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('EOF');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SqlScript', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SqlScript', this.position);
        }
      }
    }
  }
  parseSqlStatement() {
    const __memoStart = this.position;
    const __memoKey = 'SqlStatement@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule SqlStatement at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SqlStatement', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing ExplainPrefix
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseExplainPrefix();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseAlterTableStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseAnalyzeStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseAttachStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseBeginStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCommitStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCreateIndexStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCreateTableStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCreateTriggerStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCreateViewStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCreateVirtualTableStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseDeleteStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseDetachStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseDropIndexStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseDropTableStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseDropTriggerStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseDropViewStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseInsertStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parsePragmaStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseReindexStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseReleaseStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseRollbackStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSavepointStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSelectStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseUpdateStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseVacuumStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SqlStatement', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SqlStatement', this.position);
        }
      }
    }
  }
  parseExplainPrefix() {
    const __memoStart = this.position;
    const __memoKey = 'ExplainPrefix@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ExplainPrefix at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ExplainPrefix', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_EXPLAIN');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_QUERY');
    this.consume('KW_PLAN');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ExplainPrefix', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ExplainPrefix', this.position);
        }
      }
    }
  }
  parseAlterTableStmt() {
    const __memoStart = this.position;
    const __memoKey = 'AlterTableStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule AlterTableStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('AlterTableStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_ALTER');
    this.consume('KW_TABLE');
    this.parseQualifiedTableRef();
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_RENAME');
    this.consume('KW_TO');
    this.parseTableName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_RENAME');
    if (this.match('KW_COLUMN')) { /* optional token matched */ }
    this.parseColumnName();
    this.consume('KW_TO');
    this.parseColumnName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_ADD');
    if (this.match('KW_COLUMN')) { /* optional token matched */ }
    this.parseColumnDef();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_DROP');
    if (this.match('KW_COLUMN')) { /* optional token matched */ }
    this.parseColumnName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('AlterTableStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('AlterTableStmt', this.position);
        }
      }
    }
  }
  parseAnalyzeStmt() {
    const __memoStart = this.position;
    const __memoKey = 'AnalyzeStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule AnalyzeStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('AnalyzeStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_ANALYZE');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSchemaName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseTableOrIndexName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSchemaName();
    this.consume('TOKEN__2E_');
    this.parseTableOrIndexName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('AnalyzeStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('AnalyzeStmt', this.position);
        }
      }
    }
  }
  parseAttachStmt() {
    const __memoStart = this.position;
    const __memoKey = 'AttachStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule AttachStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('AttachStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_ATTACH');
    if (this.match('KW_DATABASE')) { /* optional token matched */ }
    this.parseExpr();
    this.consume('KW_AS');
    this.parseSchemaName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('AttachStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('AttachStmt', this.position);
        }
      }
    }
  }
  parseBeginStmt() {
    const __memoStart = this.position;
    const __memoKey = 'BeginStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule BeginStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('BeginStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_BEGIN');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_DEFERRED');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_IMMEDIATE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_EXCLUSIVE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    if (this.match('KW_TRANSACTION')) { /* optional token matched */ }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('BeginStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('BeginStmt', this.position);
        }
      }
    }
  }
  parseCommitStmt() {
    const __memoStart = this.position;
    const __memoKey = 'CommitStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CommitStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CommitStmt', this.position);
    }
    let __ok = false;
    try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_COMMIT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_END');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    if (this.match('KW_TRANSACTION')) { /* optional token matched */ }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CommitStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CommitStmt', this.position);
        }
      }
    }
  }
  parseRollbackStmt() {
    const __memoStart = this.position;
    const __memoKey = 'RollbackStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule RollbackStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('RollbackStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_ROLLBACK');
    if (this.match('KW_TRANSACTION')) { /* optional token matched */ }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_TO');
    if (this.match('KW_SAVEPOINT')) { /* optional token matched */ }
    this.parseSavepointName();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('RollbackStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('RollbackStmt', this.position);
        }
      }
    }
  }
  parseSavepointStmt() {
    const __memoStart = this.position;
    const __memoKey = 'SavepointStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule SavepointStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SavepointStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_SAVEPOINT');
    this.parseSavepointName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SavepointStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SavepointStmt', this.position);
        }
      }
    }
  }
  parseReleaseStmt() {
    const __memoStart = this.position;
    const __memoKey = 'ReleaseStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ReleaseStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ReleaseStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_RELEASE');
    if (this.match('KW_SAVEPOINT')) { /* optional token matched */ }
    this.parseSavepointName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ReleaseStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ReleaseStmt', this.position);
        }
      }
    }
  }
  parseDetachStmt() {
    const __memoStart = this.position;
    const __memoKey = 'DetachStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule DetachStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('DetachStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_DETACH');
    if (this.match('KW_DATABASE')) { /* optional token matched */ }
    this.parseSchemaName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('DetachStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('DetachStmt', this.position);
        }
      }
    }
  }
  parseVacuumStmt() {
    const __memoStart = this.position;
    const __memoKey = 'VacuumStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule VacuumStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('VacuumStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_VACUUM');
    // Optional: try parsing SchemaName
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaName();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_INTO');
    this.parseFilename();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('VacuumStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('VacuumStmt', this.position);
        }
      }
    }
  }
  parseReindexStmt() {
    const __memoStart = this.position;
    const __memoKey = 'ReindexStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ReindexStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ReindexStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_REINDEX');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCollationName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSchemaName();
    this.consume('TOKEN__2E_');
    this.parseTableOrIndexName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseTableOrIndexName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ReindexStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ReindexStmt', this.position);
        }
      }
    }
  }
  parsePragmaStmt() {
    const __memoStart = this.position;
    const __memoKey = 'PragmaStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule PragmaStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('PragmaStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_PRAGMA');
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsePragmaName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__3D_');
    this.parsePragmaValue();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__28_');
    this.parsePragmaValue();
    this.consume('TOKEN__29_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('PragmaStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('PragmaStmt', this.position);
        }
      }
    }
  }
  parsePragmaValue() {
    const __memoStart = this.position;
    const __memoKey = 'PragmaValue@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule PragmaValue at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('PragmaValue', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseSignedNumber();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('StringLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_ON');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_OFF');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_TRUE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_FALSE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_YES');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_NO');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 9 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('PragmaValue', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('PragmaValue', this.position);
        }
      }
    }
  }
  parseCreateIndexStmt() {
    const __memoStart = this.position;
    const __memoKey = 'CreateIndexStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CreateIndexStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CreateIndexStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_CREATE');
    if (this.match('KW_UNIQUE')) { /* optional token matched */ }
    this.consume('KW_INDEX');
    // Optional: try parsing IfNotExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfNotExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseIndexName();
    this.consume('KW_ON');
    this.parseTableName();
    this.consume('TOKEN__28_');
    this.parseIndexedColumn();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseIndexedColumn();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CreateIndexStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CreateIndexStmt', this.position);
        }
      }
    }
  }
  parseCreateTableStmt() {
    const __memoStart = this.position;
    const __memoKey = 'CreateTableStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CreateTableStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CreateTableStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_CREATE');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_TEMP');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_TEMPORARY');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('KW_TABLE');
    // Optional: try parsing IfNotExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfNotExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__28_');
    this.parseColumnDef();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnDef();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseTableConstraint();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
    // Optional: try parsing TableOptions
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseTableOptions();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_AS');
    this.parseSelectStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CreateTableStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CreateTableStmt', this.position);
        }
      }
    }
  }
  parseColumnDef() {
    const __memoStart = this.position;
    const __memoKey = 'ColumnDef@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ColumnDef at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ColumnDef', this.position);
    }
    let __ok = false;
    try {
    this.parseColumnName();
    // Optional: try parsing TypeName
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseTypeName();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseColumnConstraint();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ColumnDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ColumnDef', this.position);
        }
      }
    }
  }
  parseTypeName() {
    const __memoStart = this.position;
    const __memoKey = 'TypeName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TypeName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TypeName', this.position);
    }
    let __ok = false;
    try {
    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseTypeNameWord();
        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one TypeNameWord');
    }
    // Optional: try parsing TypeParameters
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseTypeParameters();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TypeName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TypeName', this.position);
        }
      }
    }
  }
  parseTypeNameWord() {
    const __memoStart = this.position;
    const __memoKey = 'TypeNameWord@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TypeNameWord at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TypeNameWord', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('Identifier');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_BIG');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_BIGINT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_BINARY');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_BIT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_BLOB');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_BOOLEAN');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_CHAR');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_CHARACTER');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_CLOB');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_DATE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_DATETIME');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_DECIMAL');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_DOUBLE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_FLOAT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_INT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_INTEGER');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_MEDIUMINT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_NATIONAL');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_NATIVE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_NCHAR');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_NUMERIC');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_NVARCHAR');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_PRECISION');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_REAL');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_SMALLINT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_TEXT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_TIME');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_TIMESTAMP');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_TINYINT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_UNSIGNED');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_VARBINARY');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_VARCHAR');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_VARYING');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 34 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TypeNameWord', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TypeNameWord', this.position);
        }
      }
    }
  }
  parseTypeParameters() {
    const __memoStart = this.position;
    const __memoKey = 'TypeParameters@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TypeParameters at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TypeParameters', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.parseSignedNumber();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseSignedNumber();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TypeParameters', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TypeParameters', this.position);
        }
      }
    }
  }
  parseColumnConstraint() {
    const __memoStart = this.position;
    const __memoKey = 'ColumnConstraint@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ColumnConstraint at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ColumnConstraint', this.position);
    }
    let __ok = false;
    try {
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_CONSTRAINT');
    this.parseConstraintName();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_PRIMARY');
    this.consume('KW_KEY');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_ASC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_DESC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Optional: try parsing ConflictClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseConflictClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    if (this.match('KW_AUTOINCREMENT')) { /* optional token matched */ }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_NOT');
    this.consume('KW_NULL');
    // Optional: try parsing ConflictClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseConflictClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_UNIQUE');
    // Optional: try parsing ConflictClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseConflictClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_CHECK');
    this.consume('TOKEN__28_');
    this.parseExpr();
    this.consume('TOKEN__29_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_DEFAULT');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSignedNumber();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseLiteralValue();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__28_');
    this.parseExpr();
    this.consume('TOKEN__29_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_COLLATE');
    this.parseCollationName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseForeignKeyClause();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseGeneratedColumnConstraint();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ColumnConstraint', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ColumnConstraint', this.position);
        }
      }
    }
  }
  parseGeneratedColumnConstraint() {
    const __memoStart = this.position;
    const __memoKey = 'GeneratedColumnConstraint@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule GeneratedColumnConstraint at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('GeneratedColumnConstraint', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_GENERATED');
    if (this.match('KW_ALWAYS')) { /* optional token matched */ }
    this.consume('KW_AS');
    this.consume('TOKEN__28_');
    this.parseExpr();
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_STORED');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_VIRTUAL');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_AS');
    this.consume('TOKEN__28_');
    this.parseExpr();
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_STORED');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_VIRTUAL');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('GeneratedColumnConstraint', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('GeneratedColumnConstraint', this.position);
        }
      }
    }
  }
  parseTableConstraint() {
    const __memoStart = this.position;
    const __memoKey = 'TableConstraint@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TableConstraint at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableConstraint', this.position);
    }
    let __ok = false;
    try {
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_CONSTRAINT');
    this.parseConstraintName();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_PRIMARY');
    this.consume('KW_KEY');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_UNIQUE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.consume('TOKEN__28_');
    this.parseIndexedColumn();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseIndexedColumn();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
    // Optional: try parsing ConflictClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseConflictClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_CHECK');
    this.consume('TOKEN__28_');
    this.parseExpr();
    this.consume('TOKEN__29_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_FOREIGN');
    this.consume('KW_KEY');
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
    this.parseForeignKeyClause();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableConstraint', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableConstraint', this.position);
        }
      }
    }
  }
  parseTableOptions() {
    const __memoStart = this.position;
    const __memoKey = 'TableOptions@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TableOptions at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableOptions', this.position);
    }
    let __ok = false;
    try {
    this.parseTableOption();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseTableOption();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableOptions', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableOptions', this.position);
        }
      }
    }
  }
  parseTableOption() {
    const __memoStart = this.position;
    const __memoKey = 'TableOption@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TableOption at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableOption', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_WITHOUT');
    this.consume('KW_ROWID');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_STRICT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableOption', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableOption', this.position);
        }
      }
    }
  }
  parseConflictClause() {
    const __memoStart = this.position;
    const __memoKey = 'ConflictClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ConflictClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ConflictClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_ON');
    this.consume('KW_CONFLICT');
    this.parseConflictAction();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ConflictClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ConflictClause', this.position);
        }
      }
    }
  }
  parseConflictAction() {
    const __memoStart = this.position;
    const __memoKey = 'ConflictAction@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ConflictAction at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ConflictAction', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_ROLLBACK');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_ABORT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_FAIL');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_IGNORE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_REPLACE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 5 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ConflictAction', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ConflictAction', this.position);
        }
      }
    }
  }
  parseForeignKeyClause() {
    const __memoStart = this.position;
    const __memoKey = 'ForeignKeyClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ForeignKeyClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ForeignKeyClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_REFERENCES');
    this.parseForeignTable();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseForeignKeyAction();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    // Optional: try parsing ForeignKeyMatch
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseForeignKeyMatch();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing ForeignKeyDeferrable
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseForeignKeyDeferrable();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ForeignKeyClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ForeignKeyClause', this.position);
        }
      }
    }
  }
  parseForeignKeyAction() {
    const __memoStart = this.position;
    const __memoKey = 'ForeignKeyAction@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ForeignKeyAction at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ForeignKeyAction', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_ON');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_DELETE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_UPDATE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_SET');
    this.consume('KW_NULL');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_SET');
    this.consume('KW_DEFAULT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_CASCADE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_RESTRICT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_NO');
    this.consume('KW_ACTION');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ForeignKeyAction', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ForeignKeyAction', this.position);
        }
      }
    }
  }
  parseForeignKeyMatch() {
    const __memoStart = this.position;
    const __memoKey = 'ForeignKeyMatch@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ForeignKeyMatch at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ForeignKeyMatch', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_MATCH');
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ForeignKeyMatch', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ForeignKeyMatch', this.position);
        }
      }
    }
  }
  parseForeignKeyDeferrable() {
    const __memoStart = this.position;
    const __memoKey = 'ForeignKeyDeferrable@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ForeignKeyDeferrable at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ForeignKeyDeferrable', this.position);
    }
    let __ok = false;
    try {
    if (this.match('KW_NOT')) { /* optional token matched */ }
    this.consume('KW_DEFERRABLE');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_INITIALLY');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_DEFERRED');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_IMMEDIATE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ForeignKeyDeferrable', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ForeignKeyDeferrable', this.position);
        }
      }
    }
  }
  parseCreateViewStmt() {
    const __memoStart = this.position;
    const __memoKey = 'CreateViewStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CreateViewStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CreateViewStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_CREATE');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_TEMP');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_TEMPORARY');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('KW_VIEW');
    // Optional: try parsing IfNotExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfNotExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseViewName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('KW_AS');
    this.parseSelectStmt();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CreateViewStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CreateViewStmt', this.position);
        }
      }
    }
  }
  parseCreateVirtualTableStmt() {
    const __memoStart = this.position;
    const __memoKey = 'CreateVirtualTableStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CreateVirtualTableStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CreateVirtualTableStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_CREATE');
    this.consume('KW_VIRTUAL');
    this.consume('KW_TABLE');
    // Optional: try parsing IfNotExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfNotExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();
    this.consume('KW_USING');
    this.parseModuleName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseModuleArgument();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseModuleArgument();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CreateVirtualTableStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CreateVirtualTableStmt', this.position);
        }
      }
    }
  }
  parseModuleArgument() {
    const __memoStart = this.position;
    const __memoKey = 'ModuleArgument@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ModuleArgument at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ModuleArgument', this.position);
    }
    let __ok = false;
    try {
    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseModuleArgToken();
        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one ModuleArgToken');
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ModuleArgument', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ModuleArgument', this.position);
        }
      }
    }
  }
  parseModuleArgToken() {
    const __memoStart = this.position;
    const __memoKey = 'ModuleArgToken@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ModuleArgToken at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ModuleArgToken', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('NumericLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('StringLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('BlobLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__2E_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__2B_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__2D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__2A_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__2F_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__25_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3C_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3E_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3C__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3E__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3C__3E_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__21__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__7C__7C_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3A_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__40_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__24_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 21 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ModuleArgToken', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ModuleArgToken', this.position);
        }
      }
    }
  }
  parseCreateTriggerStmt() {
    const __memoStart = this.position;
    const __memoKey = 'CreateTriggerStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CreateTriggerStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CreateTriggerStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_CREATE');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_TEMP');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_TEMPORARY');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('KW_TRIGGER');
    // Optional: try parsing IfNotExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfNotExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTriggerName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_BEFORE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_AFTER');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_INSTEAD');
    this.consume('KW_OF');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_DELETE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_INSERT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_UPDATE');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_OF');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.consume('KW_ON');
    this.parseTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_FOR');
    this.consume('KW_EACH');
    this.consume('KW_ROW');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_WHEN');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('KW_BEGIN');
    this.parseTriggerStep();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__3B_');
    this.parseTriggerStep();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    if (this.match('TOKEN__3B_')) { /* optional matched */ }
    this.consume('KW_END');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CreateTriggerStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CreateTriggerStmt', this.position);
        }
      }
    }
  }
  parseTriggerStep() {
    const __memoStart = this.position;
    const __memoKey = 'TriggerStep@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TriggerStep at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TriggerStep', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseUpdateStmt();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseInsertStmt();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseDeleteStmt();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseSelectStmt();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TriggerStep', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TriggerStep', this.position);
        }
      }
    }
  }
  parseDropIndexStmt() {
    const __memoStart = this.position;
    const __memoKey = 'DropIndexStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule DropIndexStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('DropIndexStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_DROP');
    this.consume('KW_INDEX');
    // Optional: try parsing IfExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseIndexName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('DropIndexStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('DropIndexStmt', this.position);
        }
      }
    }
  }
  parseDropTableStmt() {
    const __memoStart = this.position;
    const __memoKey = 'DropTableStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule DropTableStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('DropTableStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_DROP');
    this.consume('KW_TABLE');
    // Optional: try parsing IfExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('DropTableStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('DropTableStmt', this.position);
        }
      }
    }
  }
  parseDropTriggerStmt() {
    const __memoStart = this.position;
    const __memoKey = 'DropTriggerStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule DropTriggerStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('DropTriggerStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_DROP');
    this.consume('KW_TRIGGER');
    // Optional: try parsing IfExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTriggerName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('DropTriggerStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('DropTriggerStmt', this.position);
        }
      }
    }
  }
  parseDropViewStmt() {
    const __memoStart = this.position;
    const __memoKey = 'DropViewStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule DropViewStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('DropViewStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_DROP');
    this.consume('KW_VIEW');
    // Optional: try parsing IfExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseViewName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('DropViewStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('DropViewStmt', this.position);
        }
      }
    }
  }
  parseInsertStmt() {
    const __memoStart = this.position;
    const __memoKey = 'InsertStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule InsertStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('InsertStmt', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing WithClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseWithClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_INSERT');
    // Optional: try parsing ConflictModifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseConflictModifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_REPLACE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.consume('KW_INTO');
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_AS');
    this.parseTableAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseDefaultValues();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseValuesClause();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSelectStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseUpsertClause();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    // Optional: try parsing ReturningClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseReturningClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('InsertStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('InsertStmt', this.position);
        }
      }
    }
  }
  parseConflictModifier() {
    const __memoStart = this.position;
    const __memoKey = 'ConflictModifier@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ConflictModifier at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ConflictModifier', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_OR');
    this.parseConflictAction();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ConflictModifier', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ConflictModifier', this.position);
        }
      }
    }
  }
  parseDefaultValues() {
    const __memoStart = this.position;
    const __memoKey = 'DefaultValues@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule DefaultValues at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('DefaultValues', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_DEFAULT');
    this.consume('KW_VALUES');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('DefaultValues', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('DefaultValues', this.position);
        }
      }
    }
  }
  parseValuesClause() {
    const __memoStart = this.position;
    const __memoKey = 'ValuesClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ValuesClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ValuesClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_VALUES');
    this.parseParenthesizedExprList();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseParenthesizedExprList();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ValuesClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ValuesClause', this.position);
        }
      }
    }
  }
  parseParenthesizedExprList() {
    const __memoStart = this.position;
    const __memoKey = 'ParenthesizedExprList@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ParenthesizedExprList at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ParenthesizedExprList', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.parseExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ParenthesizedExprList', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ParenthesizedExprList', this.position);
        }
      }
    }
  }
  parseUpsertClause() {
    const __memoStart = this.position;
    const __memoKey = 'UpsertClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule UpsertClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UpsertClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_ON');
    this.consume('KW_CONFLICT');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseIndexedColumn();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseIndexedColumn();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('KW_DO');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_NOTHING');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_UPDATE');
    this.consume('KW_SET');
    this.parseUpdateAssignment();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseUpdateAssignment();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UpsertClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UpsertClause', this.position);
        }
      }
    }
  }
  parseUpdateStmt() {
    const __memoStart = this.position;
    const __memoKey = 'UpdateStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule UpdateStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UpdateStmt', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing WithClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseWithClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('KW_UPDATE');
    // Optional: try parsing ConflictModifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseConflictModifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseQualifiedTableName();
    this.consume('KW_SET');
    this.parseUpdateAssignment();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseUpdateAssignment();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Optional: try parsing UpdateFromClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseUpdateFromClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Optional: try parsing ReturningClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseReturningClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing UpdateDeleteLimitClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseUpdateDeleteLimitClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UpdateStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UpdateStmt', this.position);
        }
      }
    }
  }
  parseUpdateAssignment() {
    const __memoStart = this.position;
    const __memoKey = 'UpdateAssignment@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule UpdateAssignment at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UpdateAssignment', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseColumnName();
    this.consume('TOKEN__3D_');
    this.parseExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
    this.consume('TOKEN__3D_');
    this.parseExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UpdateAssignment', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UpdateAssignment', this.position);
        }
      }
    }
  }
  parseUpdateFromClause() {
    const __memoStart = this.position;
    const __memoKey = 'UpdateFromClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule UpdateFromClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UpdateFromClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_FROM');
    this.parseTableOrSubquery();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseTableOrSubquery();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UpdateFromClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UpdateFromClause', this.position);
        }
      }
    }
  }
  parseDeleteStmt() {
    const __memoStart = this.position;
    const __memoKey = 'DeleteStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule DeleteStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('DeleteStmt', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing WithClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseWithClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('KW_DELETE');
    this.consume('KW_FROM');
    this.parseQualifiedTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Optional: try parsing ReturningClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseReturningClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing UpdateDeleteLimitClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseUpdateDeleteLimitClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('DeleteStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('DeleteStmt', this.position);
        }
      }
    }
  }
  parseUpdateDeleteLimitClause() {
    const __memoStart = this.position;
    const __memoKey = 'UpdateDeleteLimitClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule UpdateDeleteLimitClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UpdateDeleteLimitClause', this.position);
    }
    let __ok = false;
    try {
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_ORDER');
    this.consume('KW_BY');
    this.parseOrderingTerm();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseOrderingTerm();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('KW_LIMIT');
    this.parseExpr();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    // Group
    {
    this.consume('KW_OFFSET');
    this.parseExpr();
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    // Group
    {
    this.consume('TOKEN__2C_');
    this.parseExpr();
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UpdateDeleteLimitClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UpdateDeleteLimitClause', this.position);
        }
      }
    }
  }
  parseQualifiedTableName() {
    const __memoStart = this.position;
    const __memoKey = 'QualifiedTableName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule QualifiedTableName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('QualifiedTableName', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_INDEXED');
    this.consume('KW_BY');
    this.parseIndexName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_NOT');
    this.consume('KW_INDEXED');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('QualifiedTableName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('QualifiedTableName', this.position);
        }
      }
    }
  }
  parseReturningClause() {
    const __memoStart = this.position;
    const __memoKey = 'ReturningClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ReturningClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ReturningClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_RETURNING');
    this.parseResultColumn();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseResultColumn();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ReturningClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ReturningClause', this.position);
        }
      }
    }
  }
  parseSelectStmt() {
    const __memoStart = this.position;
    const __memoKey = 'SelectStmt@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule SelectStmt at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SelectStmt', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing WithClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseWithClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseSelectCore();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.parseCompoundOperator();
    this.parseSelectCore();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_ORDER');
    this.consume('KW_BY');
    this.parseOrderingTerm();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseOrderingTerm();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Optional: try parsing LimitClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseLimitClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SelectStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SelectStmt', this.position);
        }
      }
    }
  }
  parseWithClause() {
    const __memoStart = this.position;
    const __memoKey = 'WithClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule WithClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('WithClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_WITH');
    if (this.match('KW_RECURSIVE')) { /* optional token matched */ }
    this.parseCommonTableExpression();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseCommonTableExpression();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('WithClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('WithClause', this.position);
        }
      }
    }
  }
  parseCommonTableExpression() {
    const __memoStart = this.position;
    const __memoKey = 'CommonTableExpression@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CommonTableExpression at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CommonTableExpression', this.position);
    }
    let __ok = false;
    try {
    this.parseTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('KW_AS');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_NOT');
    this.consume('KW_MATERIALIZED');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_MATERIALIZED');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN__28_');
    this.parseSelectStmt();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CommonTableExpression', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CommonTableExpression', this.position);
        }
      }
    }
  }
  parseSelectCore() {
    const __memoStart = this.position;
    const __memoKey = 'SelectCore@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule SelectCore at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SelectCore', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_SELECT');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_DISTINCT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_ALL');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.parseResultColumn();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseResultColumn();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Optional: try parsing FromClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseFromClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Optional: try parsing GroupByClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseGroupByClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing WindowClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseWindowClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseValuesClause();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SelectCore', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SelectCore', this.position);
        }
      }
    }
  }
  parseFromClause() {
    const __memoStart = this.position;
    const __memoKey = 'FromClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule FromClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FromClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_FROM');
    this.parseJoinClause();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FromClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FromClause', this.position);
        }
      }
    }
  }
  parseGroupByClause() {
    const __memoStart = this.position;
    const __memoKey = 'GroupByClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule GroupByClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('GroupByClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_GROUP');
    this.consume('KW_BY');
    this.parseExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_HAVING');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('GroupByClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('GroupByClause', this.position);
        }
      }
    }
  }
  parseWindowClause() {
    const __memoStart = this.position;
    const __memoKey = 'WindowClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule WindowClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('WindowClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_WINDOW');
    this.parseNamedWindow();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseNamedWindow();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('WindowClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('WindowClause', this.position);
        }
      }
    }
  }
  parseNamedWindow() {
    const __memoStart = this.position;
    const __memoKey = 'NamedWindow@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule NamedWindow at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('NamedWindow', this.position);
    }
    let __ok = false;
    try {
    this.parseWindowName();
    this.consume('KW_AS');
    this.parseWindowDefn();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('NamedWindow', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('NamedWindow', this.position);
        }
      }
    }
  }
  parseCompoundOperator() {
    const __memoStart = this.position;
    const __memoKey = 'CompoundOperator@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CompoundOperator at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CompoundOperator', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_UNION');
    if (this.match('KW_ALL')) { /* optional token matched */ }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_INTERSECT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_EXCEPT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CompoundOperator', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CompoundOperator', this.position);
        }
      }
    }
  }
  parseLimitClause() {
    const __memoStart = this.position;
    const __memoKey = 'LimitClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule LimitClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('LimitClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_LIMIT');
    this.parseExpr();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    // Group
    {
    this.consume('KW_OFFSET');
    this.parseExpr();
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    // Group
    {
    this.consume('TOKEN__2C_');
    this.parseExpr();
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('LimitClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('LimitClause', this.position);
        }
      }
    }
  }
  parseResultColumn() {
    const __memoStart = this.position;
    const __memoKey = 'ResultColumn@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ResultColumn at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ResultColumn', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__2A_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseTableName();
    this.consume('TOKEN__2E_');
    this.consume('TOKEN__2A_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseExpr();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    if (this.match('KW_AS')) { /* optional token matched */ }
    this.parseColumnAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ResultColumn', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ResultColumn', this.position);
        }
      }
    }
  }
  parseTableOrSubquery() {
    const __memoStart = this.position;
    const __memoKey = 'TableOrSubquery@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TableOrSubquery at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableOrSubquery', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableFunctionName();
    this.consume('TOKEN__28_');
    // Optional: try parsing FunctionArguments
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseFunctionArguments();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    if (this.match('KW_AS')) { /* optional token matched */ }
    this.parseTableAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    if (this.match('KW_AS')) { /* optional token matched */ }
    this.parseTableAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_INDEXED');
    this.consume('KW_BY');
    this.parseIndexName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_NOT');
    this.consume('KW_INDEXED');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseSelectStmt();
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    if (this.match('KW_AS')) { /* optional token matched */ }
    this.parseTableAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseJoinClause();
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    if (this.match('KW_AS')) { /* optional token matched */ }
    this.parseTableAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseTableOrSubquery();
    // Group +
    {
      let _count = 0;
      while (true) {
        const _loopStart = this.position;
        const _loopMark = this.markEventState();
        try {
    this.consume('TOKEN__2C_');
    this.parseTableOrSubquery();
        } catch (e) {
          this.position = _loopStart;
          this.restoreEventState(_loopMark);
          break;
        }
        if (this.position === _loopStart) break;
        _count++;
      }
      if (_count === 0) throw new Error('Expected at least one group match');
    }
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    if (this.match('KW_AS')) { /* optional token matched */ }
    this.parseTableAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 5 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableOrSubquery', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableOrSubquery', this.position);
        }
      }
    }
  }
  parseJoinClause() {
    const __memoStart = this.position;
    const __memoKey = 'JoinClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule JoinClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('JoinClause', this.position);
    }
    let __ok = false;
    try {
    this.parseTableOrSubquery();
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseJoinTail();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('JoinClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('JoinClause', this.position);
        }
      }
    }
  }
  parseJoinTail() {
    const __memoStart = this.position;
    const __memoKey = 'JoinTail@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule JoinTail at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('JoinTail', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseTableOrSubquery();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseCrossJoinTail();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseNaturalJoinTail();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseQualifiedJoinTail();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('JoinTail', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('JoinTail', this.position);
        }
      }
    }
  }
  parseCrossJoinTail() {
    const __memoStart = this.position;
    const __memoKey = 'CrossJoinTail@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CrossJoinTail at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CrossJoinTail', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_CROSS');
    this.consume('KW_JOIN');
    this.parseTableOrSubquery();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CrossJoinTail', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CrossJoinTail', this.position);
        }
      }
    }
  }
  parseNaturalJoinTail() {
    const __memoStart = this.position;
    const __memoKey = 'NaturalJoinTail@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule NaturalJoinTail at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('NaturalJoinTail', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_NATURAL');
    // Optional: try parsing NaturalJoinType
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseNaturalJoinType();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('KW_JOIN');
    this.parseTableOrSubquery();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('NaturalJoinTail', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('NaturalJoinTail', this.position);
        }
      }
    }
  }
  parseNaturalJoinType() {
    const __memoStart = this.position;
    const __memoKey = 'NaturalJoinType@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule NaturalJoinType at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('NaturalJoinType', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_INNER');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_LEFT');
    if (this.match('KW_OUTER')) { /* optional token matched */ }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_RIGHT');
    if (this.match('KW_OUTER')) { /* optional token matched */ }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_FULL');
    if (this.match('KW_OUTER')) { /* optional token matched */ }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('NaturalJoinType', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('NaturalJoinType', this.position);
        }
      }
    }
  }
  parseQualifiedJoinTail() {
    const __memoStart = this.position;
    const __memoKey = 'QualifiedJoinTail@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule QualifiedJoinTail at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('QualifiedJoinTail', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing QualifiedJoinType
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseQualifiedJoinType();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('KW_JOIN');
    this.parseTableOrSubquery();
    // Optional: try parsing JoinConstraint
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseJoinConstraint();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('QualifiedJoinTail', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('QualifiedJoinTail', this.position);
        }
      }
    }
  }
  parseQualifiedJoinType() {
    const __memoStart = this.position;
    const __memoKey = 'QualifiedJoinType@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule QualifiedJoinType at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('QualifiedJoinType', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_INNER');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_LEFT');
    if (this.match('KW_OUTER')) { /* optional token matched */ }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_RIGHT');
    if (this.match('KW_OUTER')) { /* optional token matched */ }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_FULL');
    if (this.match('KW_OUTER')) { /* optional token matched */ }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('QualifiedJoinType', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('QualifiedJoinType', this.position);
        }
      }
    }
  }
  parseJoinConstraint() {
    const __memoStart = this.position;
    const __memoKey = 'JoinConstraint@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule JoinConstraint at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('JoinConstraint', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_ON');
    this.parseExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_USING');
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('JoinConstraint', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('JoinConstraint', this.position);
        }
      }
    }
  }
  parseOrderingTerm() {
    const __memoStart = this.position;
    const __memoKey = 'OrderingTerm@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule OrderingTerm at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('OrderingTerm', this.position);
    }
    let __ok = false;
    try {
    this.parseExpr();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_COLLATE');
    this.parseCollationName();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_ASC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_DESC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_NULLS');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_FIRST');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_LAST');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('OrderingTerm', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('OrderingTerm', this.position);
        }
      }
    }
  }
  parseIndexedColumn() {
    const __memoStart = this.position;
    const __memoKey = 'IndexedColumn@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule IndexedColumn at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('IndexedColumn', this.position);
    }
    let __ok = false;
    try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseColumnName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseExpr();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_COLLATE');
    this.parseCollationName();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_ASC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_DESC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('IndexedColumn', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('IndexedColumn', this.position);
        }
      }
    }
  }
  parseWindowDefn() {
    const __memoStart = this.position;
    const __memoKey = 'WindowDefn@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule WindowDefn at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('WindowDefn', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    // Optional: try parsing BaseWindowName
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseBaseWindowName();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_PARTITION');
    this.consume('KW_BY');
    this.parseExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_ORDER');
    this.consume('KW_BY');
    this.parseOrderingTerm();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseOrderingTerm();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Optional: try parsing FrameSpec
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseFrameSpec();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('WindowDefn', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('WindowDefn', this.position);
        }
      }
    }
  }
  parseOverClause() {
    const __memoStart = this.position;
    const __memoKey = 'OverClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule OverClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('OverClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_OVER');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseWindowName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseWindowDefn();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('OverClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('OverClause', this.position);
        }
      }
    }
  }
  parseFilterClause() {
    const __memoStart = this.position;
    const __memoKey = 'FilterClause@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule FilterClause at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FilterClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_FILTER');
    this.consume('TOKEN__28_');
    this.consume('KW_WHERE');
    this.parseExpr();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FilterClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FilterClause', this.position);
        }
      }
    }
  }
  parseFrameSpec() {
    const __memoStart = this.position;
    const __memoKey = 'FrameSpec@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule FrameSpec at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FrameSpec', this.position);
    }
    let __ok = false;
    try {
    this.parseFrameUnit();
    this.parseFrameExtent();
    // Optional: try parsing FrameExclude
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseFrameExclude();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FrameSpec', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FrameSpec', this.position);
        }
      }
    }
  }
  parseFrameUnit() {
    const __memoStart = this.position;
    const __memoKey = 'FrameUnit@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule FrameUnit at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FrameUnit', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_ROWS');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_RANGE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_GROUPS');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FrameUnit', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FrameUnit', this.position);
        }
      }
    }
  }
  parseFrameExtent() {
    const __memoStart = this.position;
    const __memoKey = 'FrameExtent@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule FrameExtent at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FrameExtent', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseFrameBoundary();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_BETWEEN');
    this.parseFrameBoundary();
    this.consume('KW_AND');
    this.parseFrameBoundary();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FrameExtent', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FrameExtent', this.position);
        }
      }
    }
  }
  parseFrameBoundary() {
    const __memoStart = this.position;
    const __memoKey = 'FrameBoundary@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule FrameBoundary at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FrameBoundary', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_UNBOUNDED');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_PRECEDING');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_FOLLOWING');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_CURRENT');
    this.consume('KW_ROW');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseExpr();
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_PRECEDING');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_FOLLOWING');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FrameBoundary', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FrameBoundary', this.position);
        }
      }
    }
  }
  parseFrameExclude() {
    const __memoStart = this.position;
    const __memoKey = 'FrameExclude@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule FrameExclude at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FrameExclude', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_EXCLUDE');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_NO');
    this.consume('KW_OTHERS');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_CURRENT');
    this.consume('KW_ROW');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_GROUP');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_TIES');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FrameExclude', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FrameExclude', this.position);
        }
      }
    }
  }
  parseExpr() {
    const __memoStart = this.position;
    const __memoKey = 'Expr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule Expr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Expr', this.position);
    }
    let __ok = false;
    try {
    this.parseOrExpr();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('Expr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('Expr', this.position);
        }
      }
    }
  }
  parseOrExpr() {
    const __memoStart = this.position;
    const __memoKey = 'OrExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule OrExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('OrExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseAndExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('KW_OR');
    this.parseAndExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('OrExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('OrExpr', this.position);
        }
      }
    }
  }
  parseAndExpr() {
    const __memoStart = this.position;
    const __memoKey = 'AndExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule AndExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('AndExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseNotExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('KW_AND');
    this.parseNotExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('AndExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('AndExpr', this.position);
        }
      }
    }
  }
  parseNotExpr() {
    const __memoStart = this.position;
    const __memoKey = 'NotExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule NotExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('NotExpr', this.position);
    }
    let __ok = false;
    try {
    while (this.match('KW_NOT')) { /* zero or more */ }
    this.parsePredicateExpr();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('NotExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('NotExpr', this.position);
        }
      }
    }
  }
  parsePredicateExpr() {
    const __memoStart = this.position;
    const __memoKey = 'PredicateExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule PredicateExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('PredicateExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseEqualityExpr();
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsePredicateTail();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('PredicateExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('PredicateExpr', this.position);
        }
      }
    }
  }
  parsePredicateTail() {
    const __memoStart = this.position;
    const __memoKey = 'PredicateTail@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule PredicateTail at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('PredicateTail', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseQuantifiedComparisonTail();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_ISNULL');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_NOTNULL');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_NOT');
    this.consume('KW_NULL');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    if (this.match('KW_NOT')) { /* optional token matched */ }
    this.consume('KW_BETWEEN');
    this.parseEqualityExpr();
    this.consume('KW_AND');
    this.parseEqualityExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    if (this.match('KW_NOT')) { /* optional token matched */ }
    this.consume('KW_IN');
    this.parseInRhs();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    if (this.match('KW_NOT')) { /* optional token matched */ }
    this.consume('KW_LIKE');
    this.parseEqualityExpr();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_ESCAPE');
    this.parseEqualityExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    if (this.match('KW_NOT')) { /* optional token matched */ }
    this.consume('KW_GLOB');
    this.parseEqualityExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    if (this.match('KW_NOT')) { /* optional token matched */ }
    this.consume('KW_REGEXP');
    this.parseEqualityExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    if (this.match('KW_NOT')) { /* optional token matched */ }
    this.consume('KW_MATCH');
    this.parseEqualityExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 10 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('PredicateTail', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('PredicateTail', this.position);
        }
      }
    }
  }
  parseQuantifiedComparisonTail() {
    const __memoStart = this.position;
    const __memoKey = 'QuantifiedComparisonTail@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule QuantifiedComparisonTail at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('QuantifiedComparisonTail', this.position);
    }
    let __ok = false;
    try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseEqualityOperator();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseRelationalOperator();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_ALL');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_ANY');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_SOME');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.consume('TOKEN__28_');
    this.parseSelectStmt();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('QuantifiedComparisonTail', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('QuantifiedComparisonTail', this.position);
        }
      }
    }
  }
  parseEqualityExpr() {
    const __memoStart = this.position;
    const __memoKey = 'EqualityExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule EqualityExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('EqualityExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseRelationalExpr();
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseEqualityTail();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('EqualityExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('EqualityExpr', this.position);
        }
      }
    }
  }
  parseEqualityTail() {
    const __memoStart = this.position;
    const __memoKey = 'EqualityTail@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule EqualityTail at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('EqualityTail', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseEqualityOperator();
    this.parseRelationalExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_IS');
    if (this.match('KW_NOT')) { /* optional token matched */ }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_DISTINCT');
    this.consume('KW_FROM');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.parseRelationalExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('EqualityTail', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('EqualityTail', this.position);
        }
      }
    }
  }
  parseEqualityOperator() {
    const __memoStart = this.position;
    const __memoKey = 'EqualityOperator@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule EqualityOperator at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('EqualityOperator', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3D__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3C__3E_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__21__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('EqualityOperator', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('EqualityOperator', this.position);
        }
      }
    }
  }
  parseRelationalExpr() {
    const __memoStart = this.position;
    const __memoKey = 'RelationalExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule RelationalExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('RelationalExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseBitwiseExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.parseRelationalOperator();
    this.parseBitwiseExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('RelationalExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('RelationalExpr', this.position);
        }
      }
    }
  }
  parseRelationalOperator() {
    const __memoStart = this.position;
    const __memoKey = 'RelationalOperator@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule RelationalOperator at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('RelationalOperator', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3C_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3C__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3E_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3E__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('RelationalOperator', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('RelationalOperator', this.position);
        }
      }
    }
  }
  parseInRhs() {
    const __memoStart = this.position;
    const __memoKey = 'InRhs@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule InRhs at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('InRhs', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSelectStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableFunctionName();
    this.consume('TOKEN__28_');
    // Optional: try parsing FunctionArguments
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseFunctionArguments();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('InRhs', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('InRhs', this.position);
        }
      }
    }
  }
  parseBitwiseExpr() {
    const __memoStart = this.position;
    const __memoKey = 'BitwiseExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule BitwiseExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('BitwiseExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseAddExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__26_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__7C_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__3C__3C_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__3E__3E_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.parseAddExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('BitwiseExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('BitwiseExpr', this.position);
        }
      }
    }
  }
  parseAddExpr() {
    const __memoStart = this.position;
    const __memoKey = 'AddExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule AddExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('AddExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseMultiplyExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2B_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2D_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.parseMultiplyExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('AddExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('AddExpr', this.position);
        }
      }
    }
  }
  parseMultiplyExpr() {
    const __memoStart = this.position;
    const __memoKey = 'MultiplyExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule MultiplyExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('MultiplyExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseConcatExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2A_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2F_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__25_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.parseConcatExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('MultiplyExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('MultiplyExpr', this.position);
        }
      }
    }
  }
  parseConcatExpr() {
    const __memoStart = this.position;
    const __memoKey = 'ConcatExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ConcatExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ConcatExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseCollateExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__7C__7C_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2D__3E_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2D__3E__3E_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.parseCollateExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ConcatExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ConcatExpr', this.position);
        }
      }
    }
  }
  parseCollateExpr() {
    const __memoStart = this.position;
    const __memoKey = 'CollateExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CollateExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CollateExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseUnaryExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('KW_COLLATE');
    this.parseCollationName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CollateExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CollateExpr', this.position);
        }
      }
    }
  }
  parseUnaryExpr() {
    const __memoStart = this.position;
    const __memoKey = 'UnaryExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule UnaryExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UnaryExpr', this.position);
    }
    let __ok = false;
    try {
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2B_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2D_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__7E_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.parsePrimaryExpr();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UnaryExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UnaryExpr', this.position);
        }
      }
    }
  }
  parsePrimaryExpr() {
    const __memoStart = this.position;
    const __memoKey = 'PrimaryExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule PrimaryExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('PrimaryExpr', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseLiteralValue();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('BindParameter');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseFunctionInvocation();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseQualifiedColumnRef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseCastExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseCaseExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseExistsExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseRaiseFunction();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseSelectStmt();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseRowValueExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseExpr();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 11 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('PrimaryExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('PrimaryExpr', this.position);
        }
      }
    }
  }
  parseRowValueExpr() {
    const __memoStart = this.position;
    const __memoKey = 'RowValueExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule RowValueExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('RowValueExpr', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.parseExpr();
    this.consume('TOKEN__2C_');
    this.parseExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('RowValueExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('RowValueExpr', this.position);
        }
      }
    }
  }
  parseQualifiedColumnRef() {
    const __memoStart = this.position;
    const __memoKey = 'QualifiedColumnRef@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule QualifiedColumnRef at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('QualifiedColumnRef', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseSchemaName();
    this.consume('TOKEN__2E_');
    this.parseTableName();
    this.consume('TOKEN__2E_');
    this.parseColumnName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseTableName();
    this.consume('TOKEN__2E_');
    this.parseColumnName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseColumnName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('QualifiedColumnRef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('QualifiedColumnRef', this.position);
        }
      }
    }
  }
  parseFunctionInvocation() {
    const __memoStart = this.position;
    const __memoKey = 'FunctionInvocation@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule FunctionInvocation at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FunctionInvocation', this.position);
    }
    let __ok = false;
    try {
    this.parseFunctionName();
    this.consume('TOKEN__28_');
    // Optional: try parsing FunctionArguments
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseFunctionArguments();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('TOKEN__29_');
    // Optional: try parsing FilterClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseFilterClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing OverClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseOverClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FunctionInvocation', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FunctionInvocation', this.position);
        }
      }
    }
  }
  parseFunctionArguments() {
    const __memoStart = this.position;
    const __memoKey = 'FunctionArguments@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule FunctionArguments at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FunctionArguments', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__2A_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_DISTINCT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_ALL');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.parseExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_ORDER');
    this.consume('KW_BY');
    this.parseOrderingTerm();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseOrderingTerm();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FunctionArguments', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FunctionArguments', this.position);
        }
      }
    }
  }
  parseCastExpr() {
    const __memoStart = this.position;
    const __memoKey = 'CastExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CastExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CastExpr', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_CAST');
    this.consume('TOKEN__28_');
    this.parseExpr();
    this.consume('KW_AS');
    this.parseTypeName();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CastExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CastExpr', this.position);
        }
      }
    }
  }
  parseCaseExpr() {
    const __memoStart = this.position;
    const __memoKey = 'CaseExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CaseExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CaseExpr', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_CASE');
    // Optional: try parsing Expr
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseExpr();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group +
    {
      let _count = 0;
      while (true) {
        const _loopStart = this.position;
        const _loopMark = this.markEventState();
        try {
    this.consume('KW_WHEN');
    this.parseExpr();
    this.consume('KW_THEN');
    this.parseExpr();
        } catch (e) {
          this.position = _loopStart;
          this.restoreEventState(_loopMark);
          break;
        }
        if (this.position === _loopStart) break;
        _count++;
      }
      if (_count === 0) throw new Error('Expected at least one group match');
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('KW_ELSE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('KW_END');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CaseExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CaseExpr', this.position);
        }
      }
    }
  }
  parseExistsExpr() {
    const __memoStart = this.position;
    const __memoKey = 'ExistsExpr@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ExistsExpr at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ExistsExpr', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_EXISTS');
    this.consume('TOKEN__28_');
    this.parseSelectStmt();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ExistsExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ExistsExpr', this.position);
        }
      }
    }
  }
  parseRaiseFunction() {
    const __memoStart = this.position;
    const __memoKey = 'RaiseFunction@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule RaiseFunction at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('RaiseFunction', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_RAISE');
    this.consume('TOKEN__28_');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_IGNORE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_ROLLBACK');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_ABORT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('KW_FAIL');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.consume('TOKEN__2C_');
    this.parseExpr();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('RaiseFunction', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('RaiseFunction', this.position);
        }
      }
    }
  }
  parseLiteralValue() {
    const __memoStart = this.position;
    const __memoKey = 'LiteralValue@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule LiteralValue at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('LiteralValue', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('NumericLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('StringLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('BlobLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_NULL');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_TRUE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_FALSE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_CURRENT_TIME');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_CURRENT_DATE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('KW_CURRENT_TIMESTAMP');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 9 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('LiteralValue', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('LiteralValue', this.position);
        }
      }
    }
  }
  parseSignedNumber() {
    const __memoStart = this.position;
    const __memoKey = 'SignedNumber@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule SignedNumber at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SignedNumber', this.position);
    }
    let __ok = false;
    try {
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2B_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2D_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('NumericLiteral');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SignedNumber', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SignedNumber', this.position);
        }
      }
    }
  }
  parseSchemaQualifier() {
    const __memoStart = this.position;
    const __memoKey = 'SchemaQualifier@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule SchemaQualifier at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SchemaQualifier', this.position);
    }
    let __ok = false;
    try {
    this.parseSchemaName();
    this.consume('TOKEN__2E_');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SchemaQualifier', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SchemaQualifier', this.position);
        }
      }
    }
  }
  parseQualifiedTableRef() {
    const __memoStart = this.position;
    const __memoKey = 'QualifiedTableRef@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule QualifiedTableRef at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('QualifiedTableRef', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('QualifiedTableRef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('QualifiedTableRef', this.position);
        }
      }
    }
  }
  parseIfExists() {
    const __memoStart = this.position;
    const __memoKey = 'IfExists@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule IfExists at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('IfExists', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_IF');
    this.consume('KW_EXISTS');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('IfExists', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('IfExists', this.position);
        }
      }
    }
  }
  parseIfNotExists() {
    const __memoStart = this.position;
    const __memoKey = 'IfNotExists@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule IfNotExists at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('IfNotExists', this.position);
    }
    let __ok = false;
    try {
    this.consume('KW_IF');
    this.consume('KW_NOT');
    this.consume('KW_EXISTS');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('IfNotExists', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('IfNotExists', this.position);
        }
      }
    }
  }
  parseName() {
    const __memoStart = this.position;
    const __memoKey = 'Name@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule Name at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Name', this.position);
    }
    let __ok = false;
    try {
    this.consume('Identifier');

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('Name', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('Name', this.position);
        }
      }
    }
  }
  parseSchemaName() {
    const __memoStart = this.position;
    const __memoKey = 'SchemaName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule SchemaName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SchemaName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SchemaName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SchemaName', this.position);
        }
      }
    }
  }
  parseTableName() {
    const __memoStart = this.position;
    const __memoKey = 'TableName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TableName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableName', this.position);
        }
      }
    }
  }
  parseTableOrIndexName() {
    const __memoStart = this.position;
    const __memoKey = 'TableOrIndexName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TableOrIndexName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableOrIndexName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableOrIndexName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableOrIndexName', this.position);
        }
      }
    }
  }
  parseIndexName() {
    const __memoStart = this.position;
    const __memoKey = 'IndexName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule IndexName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('IndexName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('IndexName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('IndexName', this.position);
        }
      }
    }
  }
  parseViewName() {
    const __memoStart = this.position;
    const __memoKey = 'ViewName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ViewName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ViewName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ViewName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ViewName', this.position);
        }
      }
    }
  }
  parseTriggerName() {
    const __memoStart = this.position;
    const __memoKey = 'TriggerName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TriggerName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TriggerName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TriggerName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TriggerName', this.position);
        }
      }
    }
  }
  parseColumnName() {
    const __memoStart = this.position;
    const __memoKey = 'ColumnName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ColumnName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ColumnName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ColumnName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ColumnName', this.position);
        }
      }
    }
  }
  parseColumnAlias() {
    const __memoStart = this.position;
    const __memoKey = 'ColumnAlias@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ColumnAlias at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ColumnAlias', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('StringLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ColumnAlias', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ColumnAlias', this.position);
        }
      }
    }
  }
  parseTableAlias() {
    const __memoStart = this.position;
    const __memoKey = 'TableAlias@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TableAlias at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableAlias', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableAlias', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableAlias', this.position);
        }
      }
    }
  }
  parseConstraintName() {
    const __memoStart = this.position;
    const __memoKey = 'ConstraintName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ConstraintName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ConstraintName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ConstraintName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ConstraintName', this.position);
        }
      }
    }
  }
  parseCollationName() {
    const __memoStart = this.position;
    const __memoKey = 'CollationName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule CollationName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CollationName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CollationName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CollationName', this.position);
        }
      }
    }
  }
  parseForeignTable() {
    const __memoStart = this.position;
    const __memoKey = 'ForeignTable@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ForeignTable at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ForeignTable', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ForeignTable', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ForeignTable', this.position);
        }
      }
    }
  }
  parseSavepointName() {
    const __memoStart = this.position;
    const __memoKey = 'SavepointName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule SavepointName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SavepointName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SavepointName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SavepointName', this.position);
        }
      }
    }
  }
  parsePragmaName() {
    const __memoStart = this.position;
    const __memoKey = 'PragmaName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule PragmaName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('PragmaName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('PragmaName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('PragmaName', this.position);
        }
      }
    }
  }
  parseModuleName() {
    const __memoStart = this.position;
    const __memoKey = 'ModuleName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule ModuleName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ModuleName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ModuleName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ModuleName', this.position);
        }
      }
    }
  }
  parseTableFunctionName() {
    const __memoStart = this.position;
    const __memoKey = 'TableFunctionName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule TableFunctionName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableFunctionName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableFunctionName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableFunctionName', this.position);
        }
      }
    }
  }
  parseFunctionName() {
    const __memoStart = this.position;
    const __memoKey = 'FunctionName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule FunctionName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FunctionName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FunctionName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FunctionName', this.position);
        }
      }
    }
  }
  parseWindowName() {
    const __memoStart = this.position;
    const __memoKey = 'WindowName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule WindowName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('WindowName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('WindowName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('WindowName', this.position);
        }
      }
    }
  }
  parseBaseWindowName() {
    const __memoStart = this.position;
    const __memoKey = 'BaseWindowName@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule BaseWindowName at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('BaseWindowName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('BaseWindowName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('BaseWindowName', this.position);
        }
      }
    }
  }
  parseFilename() {
    const __memoStart = this.position;
    const __memoKey = 'Filename@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      throw new Error('Previously failed rule Filename at position ' + __memoStart);
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Filename', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('StringLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (!__ok) {
        this.failureMemo.add(__memoKey);
      }
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('Filename', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('Filename', this.position);
        }
      }
    }
  }
}

module.exports = Parser;