function retired() {
  return Response.json(
    { error: 'Recurso indisponível nesta versão.' },
    { status: 410 },
  );
}
export const GET = retired;
export const POST = retired;
