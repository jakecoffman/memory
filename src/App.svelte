<script>
	import Dog from "./icons/Dog.svelte";
	import Card from "./Card.svelte";
	import Cat from "./icons/Cat.svelte";
	import Fish from "./icons/Fish.svelte";
	import Bird from "./icons/Bird.svelte";

	/* Randomize array in-place using Durstenfeld shuffle algorithm */
	function shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
	}

	let waiting = false
	let idx = 0
	let board = []
	let selected = []

	function reset() {
		board = [
			{image: Dog, id: idx++},
			{image: Cat, id: idx++},
			{image: Fish, id: idx++},
			{image: Bird, id: idx++},
			{image: Dog, id: idx++},
			{image: Cat, id: idx++},
			{image: Fish, id: idx++},
			{image: Bird, id: idx++},
		]
		shuffleArray(board)
		selected = []
		waiting = false
	}
	reset()

	function pick(card) {
		if (!board.find(c => !c.flipped)) {
			return reset()
		}
		if (waiting) {
			return next()
		}
		if (card.flipped) {
			return
		}
		if (!board.find(c => !c.flipped)) {
			return
		}

		card.flipped = true
		selected = [...selected, card]

		if (selected.length === 2) {
			if (selected[0].image === selected[1].image) {
				selected = []
			} else {
				waiting = true
			}
		}

		board = board
	}

	function next() {
		waiting = false
		selected.forEach(c => c.flipped = false)
		selected = []
		board = board
	}
</script>

<main>
	{#each board as card}
	<a on:click={() => pick(card)}>
		<Card isFlipped={card.flipped}>
			<svelte:component this={card.image}/>
		</Card>
	</a>
	{/each}
</main>

<style>
	main {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 1em;

		display: grid;
		grid-gap: 1rem;
		grid-template-columns: repeat(4, 20vw);
		grid-template-rows: repeat(2, 20vw);
	}

	a {
		padding: 1rem;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
</style>
