export const URL = "https://api.gohosting.space/api/";

async function getTypes() {
  try {
    const response = await fetch(URL + "types");
    if (response.status === 200) {
      const data = await response.json();
      const formatted = Object.entries(data).reduce((acc, [name, details]) => {
        acc[name] = {
          price: details.price,
          ram: `${details.ram} RAM`,
          cores: `${details.cores} Cores`,
          storage: `${details.storage} SSD`,
          features: details.features
        };
        return acc;
      }, {} as Record<string, any>);
      return formatted;
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}


export default getTypes;
