async function test() {
  try {
    const jspdf = await import('jspdf');
    console.log(Object.keys(jspdf));
  } catch (e) {
    console.log(e);
  }
}
test();
