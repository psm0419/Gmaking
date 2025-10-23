import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from '../../../components/Header';

const cardImages = [
    { src: "/images/memory/dog.png", matched: false },
    { src: "/images/memory/cat.png", matched: false },
    { src: "/images/memory/bear.png", matched: false },
    { src: "/images/memory/eagle.png", matched: false },
    { src: "/images/memory/turtle.png", matched: false },
    { src: "/images/memory/penguin.png", matched: false },
];

function MiniGameMemory() {
    const [cards, setCards] = useState([]);
    const [turns, setTurns] = useState(0);
    const [choiceOne, setChoiceOne] = useState(null);
    const [choiceTwo, setChoiceTwo] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [matchedCount, setMatchedCount] = useState(0);
    const navigate = useNavigate();

    const shuffleCards = () => {
        const shuffled = [...cardImages, ...cardImages]
            .sort(() => Math.random() - 0.5)
            .map((card) => ({ ...card, id: Math.random() }));

        setChoiceOne(null);
        setChoiceTwo(null);
        setCards(shuffled);
        setTurns(0);
        setMatchedCount(0);
    };

    const handleChoice = (card) => {
        if (disabled) return;
        if (card.matched) return; // 이미 맞춘 카드 클릭 방지
        choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
    };

    useEffect(() => {
        if (choiceOne && choiceTwo) {
            setDisabled(true);
            if (choiceOne.src === choiceTwo.src) {
                setCards((prev) =>
                    prev.map((c) =>
                        c.src === choiceOne.src ? { ...c, matched: true } : c
                    )
                );
                setMatchedCount((prev) => prev + 1);
                resetTurn();
            } else {
                // 맞지 않으면 잠깐 보여주고 다시 가림
                setTimeout(() => resetTurn(), 800);
            }
        }
    }, [choiceOne, choiceTwo]);

    const resetTurn = () => {
        setChoiceOne(null);
        setChoiceTwo(null);
        setTurns((prev) => prev + 1);
        setDisabled(false);
    };

    useEffect(() => {
        shuffleCards();
    }, []);

    return (
        <div><Header />
            <div className="min-h-[calc(100vh-60px)] bg-gray-900 flex flex-col items-center text-white py-10">
                <h1 className="text-4xl font-bold mb-8">🧠 기억력 게임</h1>

                <button
                    onClick={shuffleCards}
                    className="mb-8 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-all"
                >
                    다시 시작
                </button>

                <div className="grid grid-cols-4 gap-4">
                    {cards.map((card) => (
                        <Card
                            key={card.id}
                            card={card}
                            handleChoice={handleChoice}
                            flipped={card === choiceOne || card === choiceTwo || card.matched}
                            disabled={disabled}
                        />
                    ))}
                </div>

                <div className="mt-8 text-lg">
                    턴 수: <span className="font-bold">{turns}</span> |
                    맞춘 쌍: <span className="font-bold">{matchedCount}</span> /{" "}
                    {cardImages.length}
                </div>

                {matchedCount === cardImages.length && (
                    <div className="mt-6 text-2xl font-semibold text-green-400">
                        모든 카드를 맞췄습니다! 기억력이 대단하군요!
                    </div>
                )}
            </div>
        </div>
    );
}

function Card({ card, handleChoice, flipped, disabled }) {
    const handleClick = () => {
        if (!disabled && !flipped) handleChoice(card);
    };

    return (
        <div
            className="w-28 h-36 cursor-pointer bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden"
            onClick={handleClick}
        >
            {flipped ? (
                <img
                    src={card.src}
                    alt="animal"
                    className="w-full h-full object-cover rounded-xl"
                />
            ) : (
                <span className="text-2xl font-bold text-gray-300">?</span>
            )}
        </div>
    );
}

export default MiniGameMemory;
