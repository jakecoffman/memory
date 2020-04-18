<script>
	import Dog from "./icons/Dog.svelte";
	import Card from "./Card.svelte";
	import Cat from "./icons/Cat.svelte";
	import Fish from "./icons/Fish.svelte";
	import Bird from "./icons/Bird.svelte";
	import Lion from "./icons/Lion.svelte";
	import Snake from "./icons/Snake.svelte";
	import Chicken from "./icons/Chicken.svelte";
	import Monkey from "./icons/Monkey.svelte";
	import {onDestroy, onMount} from "svelte";

	/* Randomize array in-place using Durstenfeld shuffle algorithm */
	function shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
	}

	export let numPlayers=0

	let curPlayer = 0
	let scores = []
	for (let i=0; i<numPlayers; i++) {
		scores.push(0)
	}
	let waiting = false
	let idx = 0
	let board = []
	let selected = []

	function reset() {
		board = [
			{image: Dog, id: idx++},
			{image: Dog, id: idx++},
			{image: Cat, id: idx++},
			{image: Cat, id: idx++},
			{image: Fish, id: idx++},
			{image: Fish, id: idx++},
			{image: Bird, id: idx++},
			{image: Bird, id: idx++},
			{image: Lion, id: idx++},
			{image: Lion, id: idx++},
			{image: Snake, id: idx++},
			{image: Snake, id: idx++},
			{image: Monkey, id: idx++},
			{image: Monkey, id: idx++},
			{image: Chicken, id: idx++},
			{image: Chicken, id: idx++},
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
				scores[curPlayer] += 1
				scores = scores
				selected = []
			} else {
				waiting = true
			}
		}

		board = board
	}

	function next() {
		curPlayer += 1
		if (curPlayer >= numPlayers) {
			curPlayer = 0
		}
		waiting = false
		selected.forEach(c => c.flipped = false)
		selected = []
		board = board
	}

	const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

	let listener
	onMount(() => {
		listener = window.addEventListener('keypress', e => {
			const i = letters.findIndex(l => l === e.key.toUpperCase())
			pick(board[i])
		})
	})

	onDestroy(() => {
		window.removeEventListener('keypress', listener)
	})
</script>

<main>
	{#each board as card, index}
	<a on:click={() => pick(card)}>
		<Card isFlipped={card.flipped}>
			{#if card.flipped}
			<svelte:component this={card.image}/>
			{:else}
			{letters[index]}
			{/if}
		</Card>
	</a>
	{/each}
</main>

<aside>Player {curPlayer+1} - Score: {scores[curPlayer]}</aside>

<footer>
	Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>
</footer>

<style>
	main {
		display: grid;
		grid-gap: 1rem;
		height: 100%;
		grid-template-rows: repeat(auto-fill, 23vmin);
		grid-template-columns: repeat(auto-fill, 23vmin);
	}

	aside {
		position: fixed;
		right: 10px;
		bottom: 10px;
	}

	footer {
		margin-top: -1rem;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
</style>
