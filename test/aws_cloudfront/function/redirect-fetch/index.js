exports.handler = async (event) => {
  const res = await fetch(event.url, { redirect: 'manual' });
  return { status: res.status, location: res.headers.get('location') };
};
