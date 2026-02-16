export default function ProgressBar({progress}){
    
    const progression = {
        width: `${progress}%`,
        backgroundColor: "#040504",
    }

    return(
        <>
            <div className="flex w-full h-3 border-2 border-[#F3F3F5] rounded-md mb-2 bg-[#F3F3F5]">
                <div style={progression} className="rounded-md h-full w-full"></div>
            </div>
        </>
    )
}