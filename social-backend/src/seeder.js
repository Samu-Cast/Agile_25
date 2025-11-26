const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// modifica qui:
const POST_ID = "PurDKsuTEdFL3DIezTkA";   // <-- inserisci l'id del post
const USER_SAM = "3DgIOT0gwlMtmxTY3zfvLn2OwfW2";
const USER_MATTEO = "bdsqtcIloFQlnwojZDN7b9WesPx2";
const USER_UYOU = "p9fUGSLRHWfUkgtFijdqMhwtHof2";

const add = async (path, data) => {
  await db.doc(path).set(data, { merge: true });
  console.log("✔ SET:", path);
};

const addSub = async (path, data) => {
  const ref = await db.collection(path).add(data);
  console.log("✔ ADD:", path, "->", ref.id);
  return ref.id;
};

(async () => {
  try {

    // --------------------------------------------------------
    // 1️⃣ COMMENTO 1 (Sam)
    // --------------------------------------------------------
    const comment1 = {
      uid: USER_SAM,
      text: "Grande fratè 🙏🔥",
      createdAt: new Date(),
      parentComment: null
    };

    const comment1Id = await addSub(`posts/${POST_ID}/comments`, comment1);


    // --------------------------------------------------------
    // 2️⃣ COMMENTO 2 (Matteo)
    // --------------------------------------------------------
    const comment2 = {
      uid: USER_MATTEO,
      text: "Che stile hahahah bello!",
      createdAt: new Date(),
      parentComment: null
    };

    const comment2Id = await addSub(`posts/${POST_ID}/comments`, comment2);


    // --------------------------------------------------------
    // 3️⃣ RISPOSTA (thread) al COMMENTO 1
    // --------------------------------------------------------
    const reply1 = {
      uid: USER_UYOU,
      text: "Fratemi ❤️",
      createdAt: new Date(),
      parentComment: comment1Id
    };

    await addSub(`posts/${POST_ID}/comments`, reply1);


    // --------------------------------------------------------
    // 4️⃣ LIKE: Sam
    // --------------------------------------------------------
    await add(`posts/${POST_ID}/likes/${USER_SAM}`, {
      likedAt: new Date()
    });

    // --------------------------------------------------------
    // 5️⃣ LIKE: Matteo
    // --------------------------------------------------------
    await add(`posts/${POST_ID}/likes/${USER_MATTEO}`, {
      likedAt: new Date()
    });

    // --------------------------------------------------------
    // 6️⃣ LIKE: uYou
    // --------------------------------------------------------
    await add(`posts/${POST_ID}/likes/${USER_UYOU}`, {
      likedAt: new Date()
    });


    // --------------------------------------------------------
    // 7️⃣ AGGIORNA counts nel post
    // --------------------------------------------------------
    await add(`posts/${POST_ID}`, {
      commentsCount: 3,
      likesCount: 3
    });

    console.log("🔥 Post popolato con commenti + like!");

    process.exit(0);

  } catch (err) {
    console.error("❌ ERRORE:", err);
    process.exit(1);
  }
})();
