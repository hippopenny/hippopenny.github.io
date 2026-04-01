export const SIMULATOR_CONFIGS = {
  "genshin-impact": {
    key: "genshin-impact",
    title: "Genshin Impact Pull Test",
    subtitle: "Fan-style banner pulls for Arlecchino, Furina, and Nahida.",
    accent: "#37c6ff",
    backdrop: "/assets/images/wackywisher/4.png",
    guideHubUrl: "/characters/genshin-impact/",
    currency: {
      premiumName: "Primogems",
      ticketName: "Intertwined Fate",
      costPerWish: 160,
      startingAmount: 1600,
      adRewardAmount: 7200,
      adCooldownMs: 6 * 60 * 60 * 1000
    },
    pity: {
      fiveStarHard: 90,
      fourStarHard: 10,
      baseFiveStarRate: 0.006,
      baseFourStarRate: 0.051,
      featuredWinRate: 0.5,
      fourStarFloorFiveStarRate: 0.06
    },
    banners: [
      {
        id: "arlecchino",
        name: "Arlecchino",
        label: "Pyro Parade",
        image: "/assets/images/wackywisher/2.png",
        guideUrl: "/characters/genshin-impact/arlecchino/",
        blurb: "Aggressive on-field DPS banner with a selfish carry payoff."
      },
      {
        id: "furina",
        name: "Furina",
        label: "Hydro Encore",
        image: "/assets/images/wackywisher/1.png",
        guideUrl: "/characters/genshin-impact/furina/",
        blurb: "High-value support banner with strong account-scaling appeal."
      },
      {
        id: "nahida",
        name: "Nahida",
        label: "Dendro Spark",
        image: "/assets/images/wackywisher/3.png",
        guideUrl: "/characters/genshin-impact/nahida/",
        blurb: "Low-friction reaction support banner for broad roster value."
      }
    ],
    standardFiveStarPool: [
      { id: "std-diluc", name: "Diluc", image: null },
      { id: "std-jean", name: "Jean", image: null },
      { id: "std-mona", name: "Mona", image: null },
      { id: "std-keqing", name: "Keqing", image: null },
      { id: "std-qiqi", name: "Qiqi", image: null },
      { id: "std-tighnari", name: "Tighnari", image: null },
      { id: "std-dehya", name: "Dehya", image: null }
    ],
    fourStarPool: [
      { id: "favonius-note", name: "Favonius Note", label: "4-Star Cache", kind: "Support Drop" },
      { id: "hydro-seal", name: "Hydro Seal", label: "4-Star Cache", kind: "Boost Drop" },
      { id: "dendro-emblem", name: "Dendro Emblem", label: "4-Star Cache", kind: "Boost Drop" }
    ],
    threeStarPool: [
      { id: "adventurers-pack", name: "Adventurer Pack", label: "3-Star", kind: "Common Drop" },
      { id: "slime-core", name: "Slime Core", label: "3-Star", kind: "Common Drop" },
      { id: "mora-bag", name: "Mora Bag", label: "3-Star", kind: "Common Drop" }
    ]
  },
  "honkai-star-rail": {
    key: "honkai-star-rail",
    title: "Honkai: Star Rail Pull Test",
    subtitle: "Fan-style warp banners for Acheron, Firefly, and Ruan Mei.",
    accent: "#7b8cff",
    backdrop: "/assets/images/offrail/background-smaller.png",
    guideHubUrl: "/characters/honkai-star-rail/",
    currency: {
      premiumName: "Stellar Jade",
      ticketName: "Star Rail Special Pass",
      costPerWish: 160,
      startingAmount: 1600,
      adRewardAmount: 7200,
      adCooldownMs: 6 * 60 * 60 * 1000
    },
    pity: {
      fiveStarHard: 90,
      fourStarHard: 10,
      baseFiveStarRate: 0.006,
      baseFourStarRate: 0.051,
      featuredWinRate: 0.5,
      fourStarFloorFiveStarRate: 0.06
    },
    banners: [
      {
        id: "acheron",
        name: "Acheron",
        label: "Storm Verdict",
        image: "/assets/images/offrail/banner.png",
        guideUrl: "/characters/honkai-star-rail/acheron/",
        blurb: "High-ceiling premium carry banner that rewards structured teams."
      },
      {
        id: "firefly",
        name: "Firefly",
        label: "Break Horizon",
        image: "/assets/images/offrail/firefly-2.png",
        guideUrl: "/characters/honkai-star-rail/firefly/",
        blurb: "Break-focused carry banner with strong identity and higher setup needs."
      },
      {
        id: "ruan-mei",
        name: "Ruan Mei",
        label: "Harmony Drift",
        image: "/assets/images/offrail/ruanmei.JPG",
        guideUrl: "/characters/honkai-star-rail/ruan-mei/",
        blurb: "Broad account-value support banner for players chasing consistency."
      }
    ],
    standardFiveStarPool: [
      { id: "std-himeko", name: "Himeko", image: null },
      { id: "std-welt", name: "Welt", image: null },
      { id: "std-gepard", name: "Gepard", image: null },
      { id: "std-yanqing", name: "Yanqing", image: null },
      { id: "std-bailu", name: "Bailu", image: null },
      { id: "std-clara", name: "Clara", image: null }
    ],
    fourStarPool: [
      { id: "rail-cache", name: "Rail Cache", label: "4-Star Cache", kind: "Support Drop" },
      { id: "break-circuit", name: "Break Circuit", label: "4-Star Cache", kind: "Boost Drop" },
      { id: "harmony-ticket", name: "Harmony Ticket", label: "4-Star Cache", kind: "Boost Drop" }
    ],
    threeStarPool: [
      { id: "trailblaze-ration", name: "Trailblaze Ration", label: "3-Star", kind: "Common Drop" },
      { id: "stellar-scrap", name: "Stellar Scrap", label: "3-Star", kind: "Common Drop" },
      { id: "credit-pack", name: "Credit Pack", label: "3-Star", kind: "Common Drop" }
    ]
  },
  "wuthering-waves": {
    key: "wuthering-waves",
    title: "Wuthering Waves Pull Test",
    subtitle: "Fan-style convenes for Camellya, Jinhsi, and Verina.",
    accent: "#ff8a65",
    backdrop: "/assets/images/wackywuwa/banner.png",
    guideHubUrl: "/characters/wuthering-waves/",
    currency: {
      premiumName: "Astrite",
      ticketName: "Lustrous Tide",
      costPerWish: 160,
      startingAmount: 1600,
      adRewardAmount: 7200,
      adCooldownMs: 6 * 60 * 60 * 1000
    },
    pity: {
      fiveStarHard: 80,
      fourStarHard: 10,
      baseFiveStarRate: 0.008,
      baseFourStarRate: 0.06,
      featuredWinRate: 0.5,
      fourStarFloorFiveStarRate: 0.06
    },
    banners: [
      {
        id: "camellya",
        name: "Camellya",
        label: "Havoc Bloom",
        image: "/assets/images/wackywuwa/2.jpg",
        guideUrl: "/characters/wuthering-waves/camellya/",
        blurb: "Premium carry banner for players ready to commit field time and resources."
      },
      {
        id: "jinhsi",
        name: "Jinhsi",
        label: "Spectro Crown",
        image: "/assets/images/wackywuwa/1.png",
        guideUrl: "/characters/wuthering-waves/jinhsi/",
        blurb: "Broad-appeal carry banner with a cleaner value proposition."
      },
      {
        id: "verina",
        name: "Verina",
        label: "Garden Support",
        image: "/assets/images/wackywuwa/chat.webp",
        guideUrl: "/characters/wuthering-waves/verina/",
        blurb: "Roster-stabilizing support banner with immediate practical value."
      }
    ],
    standardFiveStarPool: [
      { id: "std-encore", name: "Encore", image: null },
      { id: "std-jianxin", name: "Jianxin", image: null },
      { id: "std-lingyang", name: "Lingyang", image: null },
      { id: "std-calcharo", name: "Calcharo", image: null },
      { id: "std-yinlin", name: "Yinlin", image: null },
      { id: "std-changli", name: "Changli", image: null },
      { id: "std-zhezhi", name: "Zhezhi", image: null }
    ],
    fourStarPool: [
      { id: "echo-chip", name: "Echo Chip", label: "4-Star Cache", kind: "Support Drop" },
      { id: "resonance-shard", name: "Resonance Shard", label: "4-Star Cache", kind: "Boost Drop" },
      { id: "tacet-core", name: "Tacet Core", label: "4-Star Cache", kind: "Boost Drop" }
    ],
    threeStarPool: [
      { id: "wave-shell", name: "Wave Shell", label: "3-Star", kind: "Common Drop" },
      { id: "repair-cache", name: "Repair Cache", label: "3-Star", kind: "Common Drop" },
      { id: "echo-dust", name: "Echo Dust", label: "3-Star", kind: "Common Drop" }
    ]
  }
};
