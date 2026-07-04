function Title({text1, text2}){
    return(
        <>
        <h1 className="font-medium text-lg sm:text-xl md:text-2xl" >
            {text1} <span className="underline text-primary decoration-2 underline-offset-4">
            {text2} </span>
        </h1>
        </>
    )
}
export default Title;