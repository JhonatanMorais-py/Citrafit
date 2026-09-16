import test from "node:test";
import assert from "node:assert/strict";

import { validateRegistration } from "../backend/modules/auth/register-controller.js";

const account = password => ({
  name: "Pessoa de Teste",
  email: "pessoa@example.com",
  password,
});

test("registration requires an uppercase letter and a special character", () => {
  assert.match(validateRegistration(account("senhaforte!")).error, /maiúscula/);
  assert.match(validateRegistration(account("SenhaForte1")).error, /caractere especial/);
  assert.match(validateRegistration(account("Senha Forte1")).error, /caractere especial/);
  assert.deepEqual(validateRegistration(account("SenhaForte!")), { value: account("SenhaForte!") });
  assert.deepEqual(validateRegistration(account("Árvoreforte#")), { value: account("Árvoreforte#") });
});
