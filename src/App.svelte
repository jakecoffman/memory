<script>
    import Game from "./Game.svelte";

    let playing = false;
    let numPlayers

    // warn before leaving
    window.onbeforeunload = () => true;

    function start(nPlayers) {
        numPlayers = nPlayers
        playing = true
    }
</script>

{#if !playing}
    <h1>Memory</h1>

    <h2>Choose players</h2>

    <div>
        <button on:click={() => start(1)}>1</button>
        <button on:click={() => start(2)}>2</button>
        <button on:click={() => start(3)}>3</button>
        <button on:click={() => start(4)}>4</button>
    </div>
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
        padding: 1rem;
        font-size: 4rem;
    }
</style>