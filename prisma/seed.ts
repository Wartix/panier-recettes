import { seedKitchen } from "../src/lib/seed/kitchen";

seedKitchen()
  .then((result) => {
    console.log(`Compte démo: ${result.email} / ${result.password}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
