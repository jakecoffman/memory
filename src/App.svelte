<script>
    import Game from "./Game.svelte";

    let playing = false;
    let numPlayers

    // warn before leaving
    window.onbeforeunload = () => true;
</script>

{#if !playing}
    <h1>Memory</h1>

    <h2>Choose players</h2>

    <div>
        <button on:click={() => numPlayers = 1} class:selected={numPlayers === 1}>1</button>
        <button on:click={() => numPlayers = 2} class:selected={numPlayers === 2}>2</button>
        <button on:click={() => numPlayers = 3} class:selected={numPlayers === 3}>3</button>
        <button on:click={() => numPlayers = 4} class:selected={numPlayers === 4}>4</button>
    </div>

    <span>
        <button on:click={() => playing = true}>PLAY</button>
    </span>
{:else}
    <Game {numPlayers}/>
{/if}

<style>
    h1 {
        font-size: 4rem;
    }

    h2 {
        font-size: 2rem;
    }

    .selected {
        background: #adadff;
    }

    div {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-gap: 1rem;
    }

    span {
        display: flex;
        align-content: center;
        justify-content: center;
    }

    button {
        border-radius: 4px;
        padding: 1rem 2rem;
        font-size: 4rem;
    }
</style>