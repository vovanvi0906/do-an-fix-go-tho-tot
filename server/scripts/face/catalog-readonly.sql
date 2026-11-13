BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout='15000';
SET LOCAL lock_timeout='1000';
SELECT json_build_object(
 'identity',json_build_object('database',current_database(),'role',current_user,'server_port',inet_server_port(),'server_version',current_setting('server_version'),'read_only',current_setting('transaction_read_only')),
 'extensions',(SELECT coalesce(json_agg(row_to_json(x)),'[]'::json) FROM (SELECT extname,extversion FROM pg_extension ORDER BY extname) x),
 'columns',(SELECT coalesce(json_agg(row_to_json(x)),'[]'::json) FROM (
 SELECT c.relname AS table_name,a.attname AS column_name,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS not_null,pg_get_expr(d.adbin,d.adrelid) AS default_value
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid
 LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
 WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attnum) x),
 'enums',(SELECT coalesce(json_agg(row_to_json(x)),'[]'::json) FROM (SELECT t.typname AS name,e.enumlabel AS value,e.enumsortorder AS position FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder) x),
 'constraints',(SELECT coalesce(json_agg(row_to_json(x)),'[]'::json) FROM (SELECT c.relname AS table_name,k.conname AS name,k.contype AS type,pg_get_constraintdef(k.oid,true) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' ORDER BY c.relname,k.conname) x),
 'indexes',(SELECT coalesce(json_agg(row_to_json(x)),'[]'::json) FROM (SELECT tablename AS table_name,indexname AS name,indexdef AS definition FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname) x),
 'triggers',(SELECT coalesce(json_agg(row_to_json(x)),'[]'::json) FROM (SELECT c.relname AS table_name,t.tgname AS name,pg_get_triggerdef(t.oid,true) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY c.relname,t.tgname) x),
 'functions',(SELECT coalesce(json_agg(row_to_json(x)),'[]'::json) FROM (SELECT p.proname AS name,pg_get_function_identity_arguments(p.oid) AS arguments,md5(pg_get_functiondef(p.oid)) AS definition_md5 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind IN ('f','p') AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e') ORDER BY p.proname,p.oid) x)
);
COMMIT;
