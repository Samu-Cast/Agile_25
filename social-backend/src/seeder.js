const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// -----------------------------
// HELPERS
// -----------------------------

const add = async (path, data) => {
  await db.doc(path).set(data, { merge: true });
  console.log("✔ SET:", path);
};

const addSub = async (colPath, data) => {
  const ref = await db.collection(colPath).add(data);
  console.log("✔ ADD:", colPath, "->", ref.id);
  return ref.id;
};


// -----------------------------
// MAIN
// -----------------------------
(async () => {
  try {

    // ------------------------------------------------------------
    // 1) USERS
    // ------------------------------------------------------------
    const users = {
      sam: {
        uid: "2jhOxL66yldZ6PbXUOj4p9iwmfd2",
        email: "castellani.samuele04@gmail.com",
        name: "Sam",
        bio: "",
        createdAt: new Date(),
        lastLogin: new Date(),
        profilePic: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
        photoURL: "",
        displayName: "",
        provider: "password",
        stats: { followers: 0, following: 0, posts: 0 },
        role: "Appassionato"
      },

      matteo: {
        uid: "matteo123456789",
        email: "matteo.carda@example.com",
        name: "Matteo",
        bio: "Appassionato di espresso",
        createdAt: new Date(),
        lastLogin: new Date(),
        profilePic: "https://cdn-icons-png.flaticon.com/512/147/147144.png",
        photoURL: "",
        displayName: "",
        provider: "password",
        stats: { followers: 1, following: 1, posts: 0 },
        role: "Appassionato"
      },

      uyou: {
        uid: "uyou",
        email: "uyou@example.com",
        name: "uYou",
        bio: "Reviewer professionista",
        createdAt: new Date(),
        lastLogin: new Date(),
        profilePic: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
        photoURL: "",
        displayName: "",
        provider: "password",
        stats: { followers: 2, following: 0, posts: 1 },
        role: "Appassionato"
      }
    };

    for (const u of Object.values(users)) {
      await add(`users/${u.uid}`, u);
    }


    // ------------------------------------------------------------
    // 2) FOLLOWERS / FOLLOWING (esempio)
    // ------------------------------------------------------------
    await add(`users/2jhOxL66yldZ6PbXUOj4p9iwmfd2/following/matteo123456789`, {
      followedAt: new Date()
    });

    await add(`users/matteo123456789/followers/2jhOxL66yldZ6PbXUOj4p9iwmfd2`, {
      followedAt: new Date()
    });


    // ------------------------------------------------------------
    // 3) POSTS (con struttura come tuo esempio)
    // ------------------------------------------------------------

    const postData = {
      author: "uYou",
      coffeeBy: ["uYou"],
      coffees: 1,
      comments: 1,
      content: "Beccateve sto chicco de caffè super iper mega spaziale, na BOMBA",
      createdAt: new Date(),
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/brewhub-bd760.firebasestorage.app/o/posts%2F1764089514732_ErchiccoDURO.png?alt=media",
      tags: ["espresso", "roma", "strong"],
      title: "Er CHICCO co la C",
      votes: 4,
      ratingBy: {
        "castellani.samuele04@gmail.com": 5,
        "matteo.carda@example.com": 3
      },
      votedBy: {
        "castellani.samuele04@gmail.com": 1,
        "matteo.carda@example.com": 1,
        "uYou": 1,
        "undefined": 1
      }
    };

    const newPostId = await addSub("posts", postData);


    // ------------------------------------------------------------
    // 4) COMMENTI del post
    // ------------------------------------------------------------
    await add(`posts/${newPostId}/comments/comment1`, {
      uid: "2jhOxL66yldZ6PbXUOj4p9iwmfd2",
      text: "Ma che bomba davvero!",
      createdAt: new Date()
    });


    // ------------------------------------------------------------
    // 5) BARS (profilo bar + staff)
    // ------------------------------------------------------------
    const barId = "barCentraleRoma";

    await add(`bars/${barId}`, {
      ownerUid: "matteo123456789",
      name: "Bar Centrale Roma",
      description: "Il miglior bar de Roma centro",
      city: "Roma",
      address: "Via dei Chicchi 12",
      createdAt: new Date(),
      stats: { reviews: 3, avgRating: 4.7, posts: 2 },
      imageCover:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93"
    });

    await add(`bars/${barId}/staff/matteo123456789`, {
      role: "admin",
      addedAt: new Date()
    });


    // ------------------------------------------------------------
    // 6) ROASTERS (profilo torrefazione + staff)
    // ------------------------------------------------------------
    const roasterId = "torrefazioneIlChicco";

    await add(`roasters/${roasterId}`, {
      ownerUid: "uyou",
      name: "Torrefazione Il Chicco",
      description: "Torrefazione artigianale romana",
      city: "Roma",
      createdAt: new Date(),
      stats: { reviews: 2, avgRating: 4.9, products: 5 },
      imageCover:
        "https://images.unsplash.com/photo-1527168023839-697aa4736d0d"
    });

    await add(`roasters/${roasterId}/staff/uyou`, {
      role: "admin",
      addedAt: new Date()
    });


    // ------------------------------------------------------------
    // 7) SEARCH INDEX
    // ------------------------------------------------------------

    await add(`searchIndex/Sam`, {
      type: "user",
      searchableKeywords: ["sam", "appassionato", "castellani"],
      referenceId: users.sam.uid,
      displayName: "Sam"
    });

    await add(`searchIndex/BarCentrale`, {
      type: "bar",
      searchableKeywords: ["bar", "centrale", "roma"],
      referenceId: barId,
      displayName: "Bar Centrale Roma"
    });

    await add(`searchIndex/TorrefazioneChicco`, {
      type: "roaster",
      searchableKeywords: ["torrefazione", "chicco"],
      referenceId: roasterId,
      displayName: "Torrefazione Il Chicco"
    });


    console.log("🔥 DATABASE POPOLATO COMPLETAMENTE!");
    process.exit(0);

  } catch (err) {
    console.error("❌ ERRORE NEL SEED:", err);
    process.exit(1);
  }
})();
