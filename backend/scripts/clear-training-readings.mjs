// Execução pontual e explícita; nunca importado pela inicialização da aplicação.
import { PrismaClient } from '@prisma/client';

process.loadEnvFile('.env');
const target = new URL(process.env.DATABASE_URL);
const database = decodeURIComponent(target.pathname.slice(1));
if (!database || database.includes('/'))
  throw new Error('Banco de destino inválido.');
const clearing = process.argv.includes('--clear');
const expected = process.argv
  .find((arg) => arg.startsWith('--database='))
  ?.slice(11);
if (clearing && expected !== database)
  throw new Error(
    'Inspecione primeiro e informe --clear --database=<banco confirmado>.',
  );

const prisma = new PrismaClient();
try {
  await prisma.$connect();
  const collections = await prisma.$runCommandRaw({
    listCollections: 1,
    nameOnly: true,
  });
  const names = collections.cursor.firstBatch.map((entry) => entry.name).sort();
  const indexes = names.includes('leituras')
    ? await prisma.$runCommandRaw({ listIndexes: 'leituras' })
    : null;
  const before = await prisma.leitura.count();
  console.log(
    JSON.stringify(
      {
        host: target.hostname,
        database,
        collection: 'leituras',
        collections: names,
        before,
      },
      null,
      2,
    ),
  );
  if (clearing) {
    // Delete documents only. Preserve the collection, its indexes and all other collections.
    const result = await prisma.$runCommandRaw({
      delete: 'leituras',
      deletes: [{ q: {}, limit: 0 }],
      ordered: true,
    });
    if (result.ok !== 1 || result.writeErrors?.length)
      throw new Error('Falha ao excluir leituras.');
    const after = await prisma.leitura.count();
    const current = await prisma.$runCommandRaw({
      listCollections: 1,
      nameOnly: true,
    });
    const currentNames = current.cursor.firstBatch
      .map((entry) => entry.name)
      .sort();
    const currentIndexes = indexes
      ? await prisma.$runCommandRaw({ listIndexes: 'leituras' })
      : null;
    if (
      after !== 0 ||
      JSON.stringify(names) !== JSON.stringify(currentNames) ||
      JSON.stringify(indexes?.cursor.firstBatch) !==
        JSON.stringify(currentIndexes?.cursor.firstBatch)
    )
      throw new Error('Verificação da limpeza falhou.');
    console.log(
      JSON.stringify({
        removed: result.n,
        after,
        collectionsPreserved: true,
        indexesPreserved: true,
      }),
    );
  }
} catch (error) {
  // Não imprimir a mensagem de conexão, que pode conter credenciais do ambiente.
  console.error(
    `Operação não concluída: ${error.name}${error.code ? ` (${error.code})` : ''}.`,
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
