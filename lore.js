'use strict';
/* =====================================================================
   lore.js - the story data: NPCs, trust topics, gifts, hidden places,
   memory vignettes. Plain data only (no game calls at load).
   Beats: 'text' = the NPC speaks, 'N:text' = Nina, '~text' = narration.
   A beat can also be { if: 'flag', not: 'flag', t: 'text' }.
   Topic fields: id, group, trust (level needed), flags (all needed), not (none allowed),
   beats, ask: { opts: [ { t, beats, trust, set, also: {npc: n}, need: {item|kind, n}, done } ].
   ===================================================================== */
const TRUST_LV = [0, 6, 16, 30, 50, 80];           // trust points needed for level 0..5
const NPC_ORDER = ['brennan', 'seraphina', 'elyra', 'kai', 'finn', 'thorin', 'raika'];

const NPCS = {
  // ------------------------------------------------------------------ BRENNAN
  brennan: {
    name: 'SIR BRENNAN', full: 'Sir Brennan Stoneward', title: "CAPTAIN OF THE LION'S WATCH", col: '#4a7ac8',
    loves: ['honey', 'wool', 'f_bass'], likes: ['egg', 'f_trout', 'acorn', 'fish'], dislikes: ['stardust', 'feather'], hates: ['truffle'],
    giftLines: { love: ['I... thank you. That is far too kind.', 'The Watch will hear about this. Quietly. With respect.'], like: ['Appreciated, Miss Starweave.', 'Good. Practical. Thank you.'], dislike: ['Hm. I will find a use for it. Perhaps.'], hate: ['...Is that meant as a joke?'], meh: ['Thank you. Truly unnecessary.'] },
    chatter: [
      ['The lamps are holding. For now.', 'Walk safely, Miss Starweave. The nights are long.', 'Forty-one lamps. I count them every dusk.'],
      ['The Watch is small, but it is steady. Like me, they say.', 'You look tired. Eat something. That is an order. A polite order.'],
      ['Some nights I still smell the snow. You are the only one who would understand that.', 'Whatever comes at first frost, you will not face it alone.']],
    rain: 'Rain on the Watch banners. They never dry properly.',
    topics: [
      { id: 'b0', trust: 0, beats: ['Miss Starweave. Evening. The lamps are holding, by the look of them.', 'N:You check them every night?', 'Somebody should. The Watch is small these days, but a lamp is a lamp.', 'If you need anything, my door is the one with the banner. Try not to freeze the water barrel again.'] },
      { id: 'b1', trust: 1, beats: ['You have heard the village tell it. The Long Frost. A bitter turn of weather, a hard winter. The ballad says so.', 'N:And what do you say?', 'I say I was a captain, and captains do not discuss orders in the street.', '...But I am glad you are well, Nina. I mean that.'] },
      { id: 'b2', trust: 2, beats: ['The Watch has had a poor month. Three of the lads are down with the cough, and the pot is thin.', 'N:What do you need?'], ask: { opts: [
        { t: 'GIVE 2 FISH', need: { kind: 'fish', n: 2 }, trust: 8, beats: ['That is... that is a hot supper for eleven men. I will not forget it.', 'I walk the lamps because I swore I would. Every dusk I count them. Forty-one. If one ever goes dark, I...', 'Never mind. You are kind to listen, Nina.'] },
        { t: 'NOT RIGHT NOW', done: false, beats: ['No matter. The offer stands whenever you are ready.'] }] } },
      { id: 'b3', trust: 3, beats: ['Sit down a moment. I want to say this once, and I want to say it standing up.', 'The night of the Hollow Moon I held the ring around the Arch with sixty Lions. We were ordered to withdraw.', 'I gave the order to my men. I walked away with them. Do you understand? I walked away.', '~He looks at his hands.', 'And then I turned around. I do not remember deciding to. I went back in alone.', 'I found a girl lying in the ice. She was breathing. I carried her out.', 'N:...Me.', 'You. I could not carry two.', 'There is a cellar under the Watch post. I keep what I found there. Come when you wish. The door is at the back.'],
        set: ['brennan_saved'], place: 'brennan' },
      { id: 'b4', trust: 3, flags: ['mem_brennan'], beats: ['You have seen the cellar, then. The circlet is hers. Ysolde\'s. I found it in the snow ten steps from where I found you.', 'I could not bring it back. A circlet in a captain\'s trunk. Tell me how that looks to a Marshal.', 'There is more. I have been writing a letter for seven years. To Seraphina. I never send it.', 'N:Why not?', 'Because to explain it I would have to say I was afraid, and she would say she always knew.'], ask: { opts: [
        { t: 'SEND THE LETTER', trust: 3, set: ['nina_urges_letter'], beats: ['Send it. Just like that.', '...I will think on it.'] },
        { t: 'TELL HER YOURSELF', trust: 2, set: ['nina_urges_talk'], also: { seraphina: 2 }, beats: ['Face to face. That is harder.', 'Which is why you said it.'] },
        { t: 'BURN IT', trust: -3, set: ['nina_urges_burn'], beats: ['Burn seven years.', '...Perhaps you are right. Perhaps not. I will not decide tonight.'] }] } },
      { id: 'b5', trust: 5, beats: ['Varrick wrote again. The Order marches at first frost. He calls it a completion.', 'The Resonator was never meant to seal anything. I saw the Marshal\'s face when it woke. He was not afraid. He was pleased.', { if: 'nina_urges_letter', t: 'I sent the letter, by the way. A raven took it this morning. I have not slept since.' }, { if: 'nina_urges_talk', t: 'I have asked Seraphina to walk the lamps with me on Fourthday. I do not know if she will come.' },
        'Take the circlet. If Ysolde is anywhere, it will know her.', 'And Nina. Whatever you choose at the Arch, I am with you. I walked away once. Not twice.'], set: ['piece_brennan'] }
    ],
    place: { name: "THE WATCH CELLAR", kind: 'hatch', x: 70.5, y: 43.2, mem: 'brennan' },
    memory: ['~Cold. Torches burning blue. A man is shouting an order, and his voice breaks on it.', '~Brennan\'s voice: Withdraw. Withdraw to the road. All of you. That is an order.', '~The ring of Lions turns its back. Brennan stands alone for ten heartbeats, watching the Arch crack.', '~Then he drops his shield and runs the wrong way, into the light. Toward a girl in the ice.', '~Nina can feel his arms around her. He is saying one word, over and over. Sorry.']
  },
  // ------------------------------------------------------------------ SERAPHINA
  seraphina: {
    name: 'SERAPHINA', full: 'Seraphina Lightbrook', title: "PALADIN OF DAWN'S MERCY", col: '#e8c85a',
    loves: ['clover', 'berry', 'honey'], likes: ['egg', 'wool', 'f_sunfish'], dislikes: ['bone'], hates: [],
    giftLines: { love: ['Oh, Nina! You remembered! Come here.', 'This is lovely. You are lovely. Do not argue.'], like: ['How thoughtful. Thank you.'], dislike: ['Hm! Well. Everything has a use.'], hate: [''], meh: ['Thank you, dear.'] },
    chatter: [
      ['The chapel is open to everyone. Soup at noon.', 'Mind the step. It was a Wolfclan child who painted it, you can tell.', 'Dawn keep you, Nina.'],
      ['Come and sit a while. The kettle is always on.', 'The children keep asking about your frost-stars. Do you mind?'],
      ['It is easier to be bright when you are around. Do not tell the others I said that.', 'Thank you for listening. Truly.']],
    rain: 'Rain on the chapel roof. The sick ones sleep better in it.',
    topics: [
      { id: 's0', trust: 0, beats: ['Nina! Come in, come in. Mind the herbs.', 'The chapel is open to everyone. Soup at noon, mending at dusk, no questions asked.', 'You look pale. Have you been sleeping? ...Of course you have not. Sit.'] },
      { id: 's1', trust: 1, beats: ['You have Ysolde\'s hands, do you know? She healed fevers with a frost-touch. It breaks them like glass. I never saw it before or since.', 'N:People say I am cold.', 'Cold is just another way of being careful, dear.'] },
      { id: 's2', trust: 2, beats: ['The little ones have the winter fever again. Clover tea is the only thing they will drink without a fuss.', 'N:How much do you need?'], ask: { opts: [
        { t: 'GIVE 3 CLOVER', need: { item: 'clover', n: 3 }, trust: 8, beats: ['Bless you. They will be asleep before sunset.', '...Nina, may I tell you something? I sleep badly. The light does not come as easily as it did.', 'Do not say anything to the others. They need me bright.'], set: ['knows_sera_tired'] },
        { t: 'NOT RIGHT NOW', done: false, beats: ['Of course. Whenever you can.'] }] } },
      { id: 's3', trust: 3, beats: ['I want to tell you about the night they carried them in.', 'Lions, Wolfclan, farmers. Until sunrise. One of the Lions was barely more than a boy. He took my wrist and said, it was the Marshal. He gave the word.', 'He died before I could ask what word.', 'I wrote it down and sealed it. I have not opened it since. It is in the cellar under the chapel.', 'Come down if you like. It is called the Quiet Room.'], set: ['sera_has_confession'], place: 'seraphina' },
      { id: 's4', trust: 3, flags: ['mem_seraphina'], beats: ['You saw the Quiet Room. Good. It is easier when it is not only me who knows.', 'Brennan and I were to be wed at midwinter. After the Night he told me he had seen nothing. Nothing!', 'I knew he was lying. I have never known why.', 'If I show him the confession, he is not a coward but a deserter. Or a hero who disobeyed. I cannot tell which, and neither can the Order.'], ask: { opts: [
        { t: 'SHOW HIM', trust: 2, set: ['sera_show_him'], beats: ['Just... walk up and put it in his hand.', 'I am afraid of what is written on his face when he reads it.'] },
        { t: 'WAIT UNTIL YOU ARE READY', trust: 2, set: ['sera_waits'], beats: ['Waiting. I am rather good at that. I have had practice.'] },
        { t: 'I WILL TALK TO HIM FIRST', trust: 3, set: ['nina_mediates_sera'], also: { brennan: 2 }, beats: ['You would do that? For us?', 'Be gentle. He is more breakable than he looks.'] }] } },
      { id: 's5', trust: 5, beats: ['Give me your hand. Feel that? The cold. It is in my chest too, Nina. Since the Night.', 'I have felt it in you since the first time I held you. I never said.', 'There is a piece of the Hush in you. Ysolde put it there. She split it between herself and you so neither would break.', 'N:...I thought the cold was mine.', 'It is. It is also a gift your teacher gave you. Do not let anyone make you ashamed of it.', { if: 'sera_show_him', t: 'And I have decided. I will show Brennan the confession. Tomorrow. At the lamps.' },
        'Take the confession. It names the man who gave the word. It will matter.'], set: ['piece_seraphina', 'knows_shard'] }
    ],
    place: { name: 'THE QUIET ROOM', kind: 'hatch', x: 40.2, y: 43.2, mem: 'seraphina' },
    memory: ['~Lamplight. The smell of herbs and blood. Rows of cots in the Quiet Room.', '~Seraphina\'s hands glow gold and flicker. She is whispering a prayer, over and over, as if afraid to stop.', '~A young soldier grips her wrist. It was the Marshal. He gave the word.', '~She writes it down by candlelight. Her hand shakes. She seals it with wax and her thumb.', '~Then she looks at a small sleeping girl wrapped in a Lion\'s cloak. And she does not tell anyone what she can feel inside her.']
  },
  // ------------------------------------------------------------------ ELYRA
  elyra: {
    name: 'ELYRA', full: 'Elyra Moonveil', title: 'RANGER OF THE WHISPERING WOODS', col: '#4fa86a',
    loves: ['feather', 'pinecone', 'f_moonkoi'], likes: ['berry', 'acorn', 'clover'], dislikes: ['bone', 'gem'], hates: ['truffle'],
    giftLines: { love: ['...Hm. This is well chosen. Thank you.', 'The forest will remember this kindness.'], like: ['Acceptable. Thank you.'], dislike: ['Hm. I will find it a place.'], hate: ['Take that out of my glade.'], meh: ['Hm.'] },
    chatter: [
      ['You are standing in my light.', 'The pines are listening. Speak softer.', 'Do not follow any lights that move on their own.'],
      ['The animals have started leaving you alone near me. They think you are a friend of the wood.', 'You walk more lightly than most mages. That is not nothing.'],
      ['Sit. The Well is quiet today.', 'I used to talk to the moon more than to people. You are an improvement.']],
    rain: 'Rain is the forest talking. Let it finish.',
    topics: [
      { id: 'e0', trust: 0, beats: ['You are standing in my light.', 'N:Sorry.', 'The Well is not a toy. Do not throw coins at it. If you must speak to the moon, do it quietly.', 'You are Ysolde\'s student. Hm. You walk lightly. That is something.'] },
      { id: 'e1', trust: 1, beats: ['Three rules for the pines. Do not carry fire after dark. Do not follow lights that move on their own. Do not thank the Well. It dislikes being thanked.', 'The animals trust you. Odd. They do not trust mages as a rule.', 'You smell of snow, and snow means safety to the small ones. Interesting.'] },
      { id: 'e2', trust: 2, beats: ['Bring me two pinecones from the old pines. The big ones.', 'N:For the Well?', 'For me. Ysolde used to leave pinecones on my doorstep when she was sorry about something. Sixty years of pinecones.', 'I find I miss them.'], ask: { opts: [
        { t: 'GIVE 2 PINECONES', need: { item: 'pinecone', n: 2 }, trust: 8, beats: ['...Thank you.', 'She was my friend. My oldest friend. I have not said that aloud in seven years.'] },
        { t: 'NOT RIGHT NOW', done: false, beats: ['Hm. Another time.'] }] } },
      { id: 'e3', trust: 3, beats: ['Moonveil is not a surname. It is a duty.', 'The seal beneath the Arch was laid by my grandmothers\' grandmothers. The Circle only ever tended it.', 'My people left when the Hush stopped being quiet. I stayed. I told myself it was for the forest.', 'There is a glade past the Well where the old wardens kept their records. Follow the lamps of the Well and look for the lantern in the tree.'], set: ['elyra_warden'], place: 'elyra' },
      { id: 'e4', trust: 3, flags: ['mem_elyra'], beats: ['You found the glade. Then I owe you the truth about that night.', 'I was supposed to be at the Arch. I was late. Kai sent a raven that evening. Meet me at the Cove at midnight. Please.', 'I went. He was not there. He had lost his nerve, I suppose. By the time I reached the ridge the Arch was ice.', { if: 'kai_secret_told', t: 'You told me about the confession he wanted to make. Hm. I think some part of me always knew.' }, { not: 'kai_secret_told', t: 'I have never told Kai why I hate him. It is because I was not there. That is not his fault. I know that. It does not help.' },
        'N:You could tell him.', 'I could. I have been meaning to for seven years.'] },
      { id: 'e5', trust: 5, beats: ['Ysolde is not dead, Nina. The seal is a sleeping place. If the key turns, she wakes. If the seal breaks entirely, she does not.', 'Take the Moonveil Key. It was meant to pass to a warden, and I am the last one who is willing to stay.', 'I have loved her for sixty years and said it to a moon.', 'N:You can say it to her.', 'Yes. I intend to. If you will help me get her back.'], set: ['piece_elyra'] }
    ],
    place: { name: 'MOONVEIL GLADE', kind: 'tree', x: 48.2, y: 6.5, mem: 'elyra' },
    memory: ['~Silver trees and a hundred tiny lanterns. A younger Elyra kneels by a ring of mossy stones, laughing, with a sleeve full of pinecones.', '~Ysolde sits cross-legged opposite, hair wild, pointing at the stars. She says: the seal will outlast us all.', '~Elyra says: Not if the Order gets its hands on it. Ysolde says: Then we make sure they do not.', '~The moon is bright. Neither of them knows how few nights are left.', '~Elyra\'s last words to her, laughing: bring pinecones next time.']
  },
  // ------------------------------------------------------------------ KAI
  kai: {
    name: 'KAI', full: 'Kai Nightshade', title: 'SHADOW ROGUE OF RAVEN COVE', col: '#5a6a8a',
    loves: ['gem', 'shell', 'f_pike'], likes: ['feather', 'stardust', 'fish'], dislikes: ['egg', 'wool'], hates: ['honey'],
    giftLines: { love: ['Now THAT is what I call manners.', 'You know, I almost never get gifts. I might cry. Do not look.'], like: ['Ha! Not bad. I will find a home for it.'], dislike: ['Hm. I will pretend I like it. For you.'], hate: ['...Honey. It gets in everything. Why.'], meh: ['A gift! Suspicious. Thanks.'] },
    chatter: [
      ['Evening, moonlight. Admiring your pocket. Kidding. Mostly.', 'Lamps are nice, aren\'t they? Easy to see where people leave their things.', 'Name is Kai. If anything goes missing, it was somebody else.'],
      ['The Cove is quiet tonight. I almost like it.', 'I stole an apple this morning. I put it back. See? Growth.'],
      ['You are the only one who does not look at me like I am going to run.', 'I am trying to be less of a thief. It is exhausting.']],
    rain: 'Rain makes the Cove sing. Everything echoes. Nice cover for a thief.',
    appears: 'night',
    topics: [
      { id: 'k0', trust: 0, beats: ['Evening, moonlight. Do not mind me, I am just admiring the lamps. And your pocket. Nice pocket.', 'N:...', 'Kidding. Mostly. Name is Kai. If anything of yours goes missing, it was definitely someone else.'] },
      { id: 'k1', trust: 1, beats: ['The Cove is where I am from. Gulls, salt, bad ideas. Folks call it Raven Cove because we keep ravens. They carry messages cheaper than anybody.', 'I ought to feel bad about the apple. I do not.', 'N:You gave it back.', 'Do not tell anyone that.'] },
      { id: 'k2', trust: 2, beats: ['There are kids at the Cove who have never seen a village market. I bring them a shell each, and they trade it for sweets. Do not ask.', 'N:How many?'], ask: { opts: [
        { t: 'GIVE 3 SHELLS', need: { item: 'shell', n: 3 }, trust: 8, beats: ['You are an odd one, Starweave. A good odd one.', 'I have done one thing in my life I would take back. One. Maybe someday I will say what.'] },
        { t: 'NOT RIGHT NOW', done: false, beats: ['Fair enough. They will keep.'] }] } },
      { id: 'k3', trust: 3, beats: ['Two weeks before the Hollow Moon, I stole a stone from the Circle\'s tower. Pretty thing, pale as milk.', 'A go-between paid me. Good coin, no questions. I told myself it was a rich man\'s hobby.', 'Then the moon went dark. And I understood what I had taken.', 'N:It was the Moonstone.', 'It was the heart of the seal. And I carried it out of the tower in my coat.', 'There is a cave at the Cove where I go when I cannot sleep. I will show you. If you can stand it.'], set: ['kai_theft'], place: 'kai' },
      { id: 'k4', trust: 3, flags: ['mem_kai'], beats: ['The night of the Hollow Moon, I asked someone to meet me at the Cove. To confess. She never came.', 'I thought she had heard already. She has hated me ever since.', 'N:Elyra.', 'Do not say her name like that. It makes it real.', 'I have never told her. I would like to. I do not know how.'], ask: { opts: [
        { t: 'TELL ELYRA FOR HIM', trust: -4, set: ['kai_secret_told'], also: { elyra: 4 }, beats: ['...You what.', 'Well. That is done, then. I was a coward. You were not. Do not make a habit of it.'] },
        { t: 'KEEP IT SECRET', trust: 3, set: ['kai_secret_kept'], beats: ['You will not tell her?', 'Thank you. I mean that. When I am ready, I will.'] },
        { t: 'TELL HER YOURSELF', trust: 2, set: ['kai_secret_self'], beats: ['Easy for you to say.', 'You are right. I know you are right. I hate it.'] }] } },
      { id: 'k5', trust: 5, beats: ['The go-between was Finn Melodric. He did not know either. We both just took the coin.', 'I kept a chip of the stone. It cracked when I dropped it. It hums at night, Nina. Like it is calling for the rest.', 'N:Why give it to me?', 'Because you are the only one who is trying to fix it. Take it.', { if: 'kai_secret_told', t: 'And, uh. Elyra left me a pinecone on my boat. A pinecone. Whatever that means.' }, { if: 'kai_secret_self', t: 'I told her, you know. It went badly. Then it went better.' }], set: ['piece_kai'] }
    ],
    place: { name: 'RAVEN COVE', kind: 'cave', x: 66.2, y: 64.5, mem: 'kai' },
    memory: ['~Wet rock and gull-cry. A boy is crouched by a fire made of driftwood, counting coins.', '~A raven lands on his shoulder. He ties a message to its leg: Meet me at the Cove. Please. I have something to tell you.', '~He waits all night. The sea turns black, and the moon does not rise.', '~In the morning a messenger gallops through the cove. The Arch is ice, the Circle is gone.', '~Kai looks at the coins in his hand. Then he walks into the sea until it reaches his knees.']
  },
  // ------------------------------------------------------------------ FINN
  finn: {
    name: 'FINN', full: 'Finn Melodric', title: 'WANDERING BARD OF THE GOLDEN TAVERN', col: '#c8803a',
    loves: ['stardust', 'honey', 'f_rainbowtrout'], likes: ['feather', 'shell', 'berry', 'egg'], dislikes: ['bone'], hates: [],
    giftLines: { love: ['Oh, you magnificent creature. I shall write a verse about you.', 'My heart. My lute. My everything. Thank you.'], like: ['Delightful! Thank you, friend.'], dislike: ['A bold choice! I will think of something.'], hate: [''], meh: ['A gift! I am honoured.'] },
    chatter: [
      ['A ballad or a gossip? Today I am generous.', 'Every story is true. Just in different amounts.', 'The Golden Tavern never closes. Mostly.'],
      ['I am working on a new song. About a girl who froze a pond for the fun of it.', 'Thorin has not looked at me in a week. That is how I know I have been awful.'],
      ['You make me want to write honest songs. Terrible habit.', 'If I ever stop talking, check my pulse.']],
    rain: 'Rain on the tavern roof. The best acoustics in the Realm.',
    topics: [
      { id: 'f0', trust: 0, beats: ['A new face at my favourite table! Sit, sit. A ballad or a gossip?', 'Finn Melodric, at your service. I know a song for every mood and a lie for every occasion.', 'Today you are getting the songs.'] },
      { id: 'f1', trust: 1, beats: ['Have you heard The Song of the Long Frost? It goes, the snow came down on Lanternfall, the moon forgot her way...', 'It is the most requested song I know.', 'I hate it a little more each time I sing it.', 'N:Why?', 'Because it is a very good song about something that did not happen the way I said.'] },
      { id: 'f2', trust: 2, beats: ['Ink. A bard needs stardust for ink if he wants it to shine. I am fresh out.', 'N:Is that a request?'], ask: { opts: [
        { t: 'GIVE 1 STARDUST', need: { item: 'stardust', n: 1 }, trust: 8, beats: ['Oh, that is lovely. Look at it glitter.', 'I keep a book, you know. Of truths. A bard who only sings lies gets lonely.', 'Do not tell Thorin.'], set: ['knows_honest_book'] },
        { t: 'NOT RIGHT NOW', done: false, beats: ['No rush. I will make do with soot.'] }] } },
      { id: 'f3', trust: 3, beats: ['I brokered a theft, Nina. I was paid to find someone good at quiet work. I found Kai. I told myself the client was a collector.', 'And I wrote the ballad for the same client\'s coin. I was never a witness to the Night. I was the man who sold it.', 'There is a back room here. Behind the cask. Come when the tavern is quiet. I will leave the door open.'], set: ['finn_confessed'], place: 'finn' },
      { id: 'f4', trust: 3, flags: ['mem_finn'], beats: ['You have seen the back room. Then you know. The Honest Book. Every real story I have ever been told, written down. Including yours.', 'N:Mine?', 'Everyone thinks you are cold. I wrote down what you did for the pond fish. It is the best thing in the book.', 'I need to do something, Nina. About Thorin. About the ballad. I cannot keep singing it.'], ask: { opts: [
        { t: 'TELL THORIN', trust: 2, set: ['finn_confess_thorin'], also: { thorin: 2 }, beats: ['Tell him myself. Hm. He will throw something. He has good aim.', 'But that is a cleaner kind of pain.'] },
        { t: 'SING THE TRUE SONG', trust: 3, set: ['finn_true_song'], beats: ['In front of the whole tavern? Stars above.', 'I will need a drink first. And a very fast exit.'] },
        { t: 'WAIT', trust: 0, set: ['finn_waits'], beats: ['Wait. Right. I am a master of it.'] }] } },
      { id: 'f5', trust: 5, beats: ['The client\'s seal was a lion rampant. I did not look at it until after.', 'Varrick, of course. Paid me twice. Once for the theft and once for the song.', 'Take the Honest Book. Read it. Add to it if you want.', { if: 'finn_true_song', t: 'And I will sing the true song, you know. At the Arch. When it counts.' }, { if: 'finn_confess_thorin', t: 'Thorin threw a spanner. It missed. We spoke for an hour. It was the best hour of my year.' },
        'Be careful with the Book, Nina. There are things in it that will end friendships.'], set: ['piece_finn'] }
    ],
    place: { name: 'THE TAVERN BACK ROOM', kind: 'hatch', x: 55.4, y: 43.2, mem: 'finn' },
    memory: ['~A smoky tavern. Finn is in the corner, lute in his lap, a purse of gold on the table, and a letter in a lion-sealed envelope.', '~He reads it twice. He writes the first verse: the snow came down on Lanternfall. He crosses it out. He writes it again.', '~Thorin storms in, white-faced. Finn, what did you do? Finn: I wrote a song.', '~Thorin: you wrote a LIE. He slams the Honest Book shut. No. That was later.', '~Finn looks at the gold. And at the empty chair where Thorin sat. And he plays the song anyway.']
  },
  // ------------------------------------------------------------------ THORIN
  thorin: {
    name: 'THORIN', full: 'Thorin Grimbelt', title: 'MASTER TINKER AND FORGEKEEPER', col: '#b0703a',
    loves: ['gem', 'truffle', 'f_eel'], likes: ['bone', 'acorn', 'honey'], dislikes: ['feather'], hates: [],
    giftLines: { love: ['By my beard! Now THAT is a find.', 'Aye, aye. That will do nicely. Better than nicely.'], like: ['Hm. Useful. Thank you.'], dislike: ['Feathers. In a forge. Fine.'], hate: [''], meh: ['Hm. Thank you, lass.'] },
    chatter: [
      ['Mind the sparks.', 'Your lamp flickers? Everyone\'s does. Bad oil, I say.', 'I do not make small talk. I make lamps.'],
      ['The forge is warm. Sit if you like. Do not touch the gears.', 'Finn is humming in the tavern again. I can hear it from here. Terrible.'],
      ['I have not slept right in seven years. You make the nights easier.', 'You remind me of the best apprentice I never had.']],
    rain: 'Rain on hot iron. Best sound there is.',
    topics: [
      { id: 't0', trust: 0, beats: ['Mind the sparks. Ah. You are the lass from the farmhouse. Your lamp is flickering, is it not? Everyone\'s is. Bad oil.', 'Thorin Grimbelt, forgekeeper. I make the lamps, I mend the pots, I do not make small talk.'] },
      { id: 't1', trust: 1, beats: ['Each lamp holds a drop of captured moonlight. Do not ask where I got it.', 'N:Where did you get it?', '...Fine. Trade secret. Cold iron, warm light, good gears. That is all a lamp is.', 'A lamp is a promise, lass. Somebody will come home by it.'] },
      { id: 't2', trust: 2, beats: ['Crystal. For the lamp cores. The old ones are cracking.', 'N:How many?'], ask: { opts: [
        { t: 'GIVE 2 CRYSTALS', need: { item: 'gem', n: 2 }, trust: 8, beats: ['Aye. That will hold them another year.', 'They are dimming, lass. Every year a little. If they go out, the nights get quiet. A bad kind of quiet.', 'I do not like to think about it.'], set: ['knows_lamps_dim'] },
        { t: 'NOT RIGHT NOW', done: false, beats: ['Hm. When you can.'] }] } },
      { id: 't3', trust: 3, beats: ['I built a machine for the Order. A Resonator. They said it would strengthen the seal.', 'It ran for eleven minutes on the Night. I watched the dials. The needle went the wrong way. I knew then.', 'I took what scrap I could after and hid the rest in my cellar. The lamps are what I make to atone.', 'N:Atone...', 'Come down when you like. It is the trapdoor by the east wall.'], set: ['thorin_resonator'], place: 'thorin' },
      { id: 't4', trust: 3, flags: ['mem_thorin'], beats: ['Now you have seen it. Ugly thing, is it not? Beautiful gears, wrong purpose.', 'There is more. A decade back I sold iron to the Order. It was used on a Wolfclan outpost. Raika has never said a word. She knows.', 'N:Does she?', 'I see it in how she does not look at me. I would like to tell her myself. I am not sure it would help.'], ask: { opts: [
        { t: 'TELL RAIKA', trust: 2, set: ['thorin_tell_raika'], also: { raika: -2 }, beats: ['Hm. You may be right. Not tonight.'] },
        { t: 'LET HER COME TO YOU', trust: 3, set: ['thorin_wait_raika'], beats: ['Aye. That is how Wolfclan do it, I suppose. Patience, then.'] },
        { t: 'TELL FINN FIRST', trust: 1, set: ['thorin_tell_finn'], also: { finn: 2 }, beats: ['Finn. Of all people. Well. He did say he was sorry. Once. In song.'] }] } },
      { id: 't5', trust: 5, beats: ['The Resonator works two ways. Pull or push.', 'If we run it backward with the Moonstone whole, it does not drain the Hush. It hands it back to the seal.', 'I have the schematic. Take it. It needs seven hands. A Piece from each.', { if: 'finn_confess_thorin', t: 'And Finn and I spoke. After seven years. It was a bad song, but it was an honest one.' }, 'Whatever you decide at the Arch, I will build it. I owe the Realm that much.'], set: ['piece_thorin'] }
    ],
    place: { name: 'THE FORGE CELLAR', kind: 'hatch', x: 39.4, y: 43.2, mem: 'thorin' },
    memory: ['~A dark forge. Gears the size of cartwheels turn on a long bench. Thorin\'s hands move steadily and fast.', '~A Lion officer stands behind him. Faster, master dwarf. The Marshal wants it before the Hollow Moon.', '~Thorin: This will strengthen the seal? The officer: Of course.', '~The Resonator wakes. The dial spins the wrong way. Thorin stares at it, the sweat on his face turning cold.', '~Thorin whispers: no. No, no, no. And then he goes for the great lever, but he is two minutes too late.']
  },
  // ------------------------------------------------------------------ RAIKA
  raika: {
    name: 'RAIKA', full: 'Raika Frostbane', title: 'WOLFCLAN CHIEFTAIN', col: '#5aa0d8',
    loves: ['bone', 'f_pike', 'f_sturgeon'], likes: ['wool', 'pinecone', 'fish', 'honey'], dislikes: ['stardust', 'clover'], hates: ['feather'],
    giftLines: { love: ['Hah! Now we talk, frost-woman.', 'The pups will fight over this. Good gift.'], like: ['Mm. Fair.'], dislike: ['Hmph. Keep your fancy things.'], hate: ['Get that out of my camp.'], meh: ['Mm.'] },
    chatter: [
      ['Stay on that side of the fire.', 'The camp is not a place for tourists.', 'The wolves do not like you yet. Be patient.'],
      ['You stand well in the cold. Better than most mages.', 'The pups think you are a snow spirit. Do not correct them.'],
      ['Sit by the fire. Tell me what the village is saying.', 'You are not like the mages I knew. That is a kindness.']],
    rain: 'Rain at the camp. The tents drum. Good.',
    topics: [
      { id: 'r0', trust: 0, beats: ['You are the frost-woman. Stay on that side of the fire.', 'I am Raika, chieftain of the Wolfclan. The camp is not a place for tourists.', 'N:I am Nina.', 'Hm. I know who you are.'] },
      { id: 'r1', trust: 1, beats: ['We came down when the high pastures froze. Five hundred years of our pastures, and then in one night, gone.', 'Do not tell me it was weather. I know weather.', 'The wind knew. The wolves knew. That night, they did not howl. They watched the ridge and were silent.'] },
      { id: 'r2', trust: 2, beats: ['Bones. Two of them. Not a gift, a debt. The pups need something to chew, and the village butcher will not sell us any.', 'N:Why not?', 'He says the Wolfclan owe him for last winter. We do not. Bring the bones.'], ask: { opts: [
        { t: 'GIVE 2 BONES', need: { item: 'bone', n: 2 }, trust: 8, beats: ['Hah. You are stubborn. Good.', 'Sit. For a short while. I will tell you what the Frost took.'] },
        { t: 'NOT RIGHT NOW', done: false, beats: ['Hmph. The pups will wait. Barely.'] }] } },
      { id: 'r3', trust: 3, beats: ['My brother Hakon guided your Circle up the ridge that night. He did not come back.', 'There is something in the ice cave. It wears his face. It does not breathe. It listens when someone sings.', 'I have not shown anyone. The clan does not speak of it. They think I keep a grave.', 'If you wish to see... the cave mouth is behind the camp. Do not wake the wolves.'], set: ['raika_hakon'], place: 'raika' },
      { id: 'r4', trust: 3, flags: ['mem_raika'], beats: ['You stood before him. Many cannot.', 'It did not harm you. It never harms. It only listens.', 'N:Does anyone else know?', 'Seraphina healed our children for free. If anyone could tell me what it is, it would be her. But then she would know. And I have not decided if I want her to.'], ask: { opts: [
        { t: 'BRING SERAPHINA', trust: 2, set: ['raika_seraphina_knows'], also: { seraphina: 2 }, beats: ['Hmph. Hm. ...I will think on it.', 'But I want to be there. And I want her not to cry.'] },
        { t: 'KEEP IT BETWEEN US', trust: 3, set: ['raika_secret_kept'], beats: ['Good. I trust you to hold it. Do not make me regret it.'] },
        { t: 'TELL THORIN', trust: -3, set: ['raika_thorin_told'], also: { thorin: 2 }, beats: ['Thorin?! That cursed forgekeeper? Why him?', 'Hmph. He cannot be trusted. But... perhaps he is the one who can fix it.'] }] } },
      { id: 'r5', trust: 5, beats: ['It spoke yesterday. One word. Your name. Nina. And then, warm.', 'It knows where the seal\'s heart is. It has been listening to the ice for seven years.', 'Take Hakon\'s Echo. A thread of him that the cave let go of when I asked.', { if: 'raika_seraphina_knows', t: 'Seraphina came. She did not cry. She held my hand instead. I am still thinking about that.' },
        'The Wolfclan will stand with you at the Arch. I will make sure of it. But do not break my brother\'s thread.'], set: ['piece_raika'] }
    ],
    place: { name: 'THE WOLFCLAN ICE CAVE', kind: 'icecave', x: 88.2, y: 17.5, mem: 'raika' },
    memory: ['~A ridge in the dark. Snow blowing sideways. A young Wolfclan scout holds a lantern high, grinning. Hakon.', '~Hakon: This way, Mistress Starweave! Mind the ice, it is slick tonight!', '~Ysolde laughs and takes his arm. Behind her, Nina, small and bundled in a purple cloak, holds a star in her hand.', '~The moon dims. Hakon stops grinning. He turns toward the sound that is not a sound.', '~He steps off the path, and the Frost folds around him like a hand. His lantern goes out last.']
  }
};

// every NPC's world post: tile positions by hour range (x,y in tiles; facing)
const POSTS = {
  brennan: [[6, 17, 66.5, 44.7, 'down'], [17, 20, 44.5, 36.7, 'down'], [20, 25, 66.5, 44.7, 'down']],
  seraphina: [[6, 22, 43.5, 44.7, 'down']],
  elyra: [[0, 26, 55.4, 12.9, 'up']],
  kai: [[18, 26, 46.5, 36.7, 'left'], [0, 5, 46.5, 36.7, 'left']],
  finn: [[8, 11, 54.5, 30.6, 'right'], [11, 26, 59, 44.7, 'down']],
  thorin: [[7, 20, 35.5, 44.7, 'down'], [20, 24, 59.8, 44.7, 'down']],
  raika: [[0, 26, 71, 20.6, 'down']]
};
// buildings placed in the village (tile x, y of the top-left of the footprint; 6 wide; solid rows y-1..y+2 (4 tall))
const BUILDINGS = [
  { id: 'forge', name: 'THE FORGE', x: 33, y: 41, kind: 'forge' },
  { id: 'chapel', name: "DAWN'S CHAPEL", x: 41, y: 41, kind: 'chapel' },
  { id: 'tavern', name: 'THE GOLDEN TAVERN', x: 56, y: 41, kind: 'tavern' },
  { id: 'watch', name: "THE LION'S WATCH", x: 64, y: 41, kind: 'watch' }
];
// Nina's own memory of the Night, revealed piece by piece as she gathers the memory fragments
const NIGHT_FRAGMENTS = [
  { need: 'mem_brennan', t: 'A pair of strong arms. Someone saying sorry.' },
  { need: 'mem_seraphina', t: 'Lamplight on herbs, and gold hands that would not stop shaking.' },
  { need: 'mem_elyra', t: 'Pinecones. A laugh. Ysolde saying: the seal will outlast us all.' },
  { need: 'mem_kai', t: 'A boy waiting on a beach for someone who never came.' },
  { need: 'mem_finn', t: 'A song that was a lie, and the man who sold it.' },
  { need: 'mem_thorin', t: 'A dial spinning the wrong way. A dwarf shouting no.' },
  { need: 'mem_raika', t: 'A scout with a lantern, and a Frost that folded around him.' }
];
