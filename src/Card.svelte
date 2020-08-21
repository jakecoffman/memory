<style>
    .container {
        position: relative;
        height: 100%;
        width: 100%;
        perspective: 600px;
    }

    .card {
        position: absolute;
        cursor: pointer;
        width: 100%;
        height: 100%;
        border: 1px solid gray;
        border-radius: 4px;
        box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2),0px 1px 1px 0px rgba(0, 0, 0, 0.14),0px 1px 3px 0px rgba(0,0,0,.12);
    }

    .card.front {
        background-color: white;
    }

    .card.back {
        background-color: lightblue;
        color: #636363;
        line-height: 21vmin;
        font-size: 21vmin;
        text-align: center;
        vertical-align: center;
    }
</style>

<script>
    export let isFlipped = false

    function turn(node, {
        delay = 0,
        duration = 500
    }) {
        return {
            delay,
            duration,
            css: (t, u) => `transform: rotateY(${1 - (u * 180)}deg); opacity: ${1 - u};`
        };
    }
</script>

<div class="container">
    {#if isFlipped}
    <div class="card front" transition:turn>
        <slot/>
    </div>
    {:else}
    <div class="card back" transition:turn>
        <slot/>
    </div>
    {/if}
</div>
