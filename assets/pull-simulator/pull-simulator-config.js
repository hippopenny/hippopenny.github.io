import {
  GENSHIN_BANNERS,
  HSR_BANNERS,
  WUWA_BANNERS
} from "./pull-simulator-banners.generated.js";

export const SIMULATOR_CONFIGS = {
  "genshin-impact": {
    key: "genshin-impact",
    title: "Genshin Impact Pull Test",
    subtitle: "Fan-style featured banners for the full playable roster — pick a character, test pity, and jump to their guide.",
    accent: "#37c6ff",
    backdrop: "/assets/images/wackywisher/4.png",
    guideHubUrl: "/characters/genshin-impact/",
    currency: {
      premiumName: "Primogems",
      ticketName: "Intertwined Fate",
      costPerWish: 160,
      startingAmount: 1600,
      adRewardAmount: 320,
      adCooldownMs: 0
    },
    pity: {
      fiveStarHard: 90,
      fourStarHard: 10,
      baseFiveStarRate: 0.006,
      baseFourStarRate: 0.051,
      featuredWinRate: 0.5,
      fourStarFloorFiveStarRate: 0.06
    },
    banners: GENSHIN_BANNERS,
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
    subtitle: "Fan-style warps for every playable character — odds approximate live pity and 50/50.",
    accent: "#7b8cff",
    backdrop: "/assets/images/offrail/background-smaller.png",
    guideHubUrl: "/characters/honkai-star-rail/",
    currency: {
      premiumName: "Stellar Jade",
      ticketName: "Star Rail Special Pass",
      costPerWish: 160,
      startingAmount: 1600,
      adRewardAmount: 320,
      adCooldownMs: 0
    },
    pity: {
      fiveStarHard: 90,
      fourStarHard: 10,
      baseFiveStarRate: 0.006,
      baseFourStarRate: 0.051,
      featuredWinRate: 0.5,
      fourStarFloorFiveStarRate: 0.06
    },
    banners: HSR_BANNERS,
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
    subtitle: "Fan-style convenes for all playable resonators — pity differs from HoYo titles (80 soft context).",
    accent: "#ff8a65",
    backdrop: "/assets/images/wackywuwa/banner.png",
    guideHubUrl: "/characters/wuthering-waves/",
    currency: {
      premiumName: "Astrite",
      ticketName: "Lustrous Tide",
      costPerWish: 160,
      startingAmount: 1600,
      adRewardAmount: 320,
      adCooldownMs: 0
    },
    pity: {
      fiveStarHard: 80,
      fourStarHard: 10,
      baseFiveStarRate: 0.008,
      baseFourStarRate: 0.06,
      featuredWinRate: 0.5,
      fourStarFloorFiveStarRate: 0.06
    },
    banners: WUWA_BANNERS,
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
