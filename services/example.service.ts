export const example = () => {
  console.log('example');
};

export const sum = (a: number, b: number): number => {
  const numA = Number(a);
  const numB = Number(b);

  if (isNaN(numA) || isNaN(numB)) {
    throw new Error('Inputs must be valid numbers');
  }

  return numA + numB;
};
