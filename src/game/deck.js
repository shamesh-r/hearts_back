exports.createDeck = () => {
  const suits = ["hearts", "diamonds", "clubs", "spades"]
  const ranks = [2,3,4,5,6,7,8,9,10,"J","Q","K","A"]

  const deck = []

  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({
        id: suit + rank,
        suit,
        rank
      })
    })
  })

  return deck
}

exports.shuffle = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
}
