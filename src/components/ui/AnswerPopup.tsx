import TornCard from "../ui/TornCard.tsx";
import {useNavigate} from "react-router-dom";
import "./QuestionPopup.css";
import {useRef, useState} from "react";
import {getQuestion} from "./QuestionPopup.tsx";

const fuzzy_sets: string[][]  = [["l", "ł"], ["ł", "l", "l"]];

function findMatchedIndices(str1: string, str2: string) {

    function isSimilar(c1: string, c2: string) {
        if (c1 === c2) {
            return 2;
        }
        for (const fuzzy_pair of fuzzy_sets) {
            if (fuzzy_pair.includes(c1) && fuzzy_pair.includes(c2)) {
                return 1;
            }
        }
        return 0;
    }

    const n = str1.length;
    const m = str2.length;

    const dp = Array.from({length: n + 1}, () => Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const similarity = isSimilar(str1[i - 1].toLowerCase(), str2[j - 1].toLowerCase());
            if (similarity > 0) {
                dp[i][j] = dp[i - 1][j - 1] + similarity;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // console.log(dp);
    // backwards
    const str1_matches = new Map<number, string>();
    const str2_matches = new Map<number, string>();
    let i = n;
    let j = m;
    while (i > 0 && j > 0) {
        const similarity = isSimilar(str1[i - 1].toLowerCase(), str2[j - 1].toLowerCase());
        if (similarity > 0 && dp[i][j] === dp[i - 1][j - 1] + similarity) {
            const status = (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) ? "match" : "fuzzy";
            str1_matches.set(i - 1, status);
            str2_matches.set(j - 1, status);
            i--;
            j--;
        } else if (dp[i][j] === dp[i - 1][j]) {
            i--;
        } else {
            j--;
        }
        // console.log("cycle 2");
    }
    return [str1_matches, str2_matches];
}


function answerCheker(str1: string, str2: string) {
    const [str1_matches, str2_matches] = findMatchedIndices(str1, str2);

    // console.log(str1_matches);
    // console.log(str2_matches);

    const results_str1: [string, string][] = [];
    const results_str2: [string, string][] = [];

    let ans = 0;

    const getCode = (str: string) => {
        switch (str) {
            case "match":
                return 0;
            case "fuzzy":
                return 1;
            default:
                return 2;
        }
    }

    for (let i = 0; i < str1.length; i++) {
        const char = str1[i];
        const status = str1_matches.get(i) || "mismatch";
        ans = Math.max(getCode(status), ans);
        if (results_str1.length > 0 && results_str1[results_str1.length - 1][1] == status) {
            results_str1[results_str1.length - 1][0] += char;
        } else {
            results_str1.push([char, status]);
        }
    }

    for (let j = 0; j < str2.length; j++) {
        const char = str2[j];
        const status = str2_matches.get(j) || "new";
        ans = Math.max(getCode(status), ans);
        if (results_str2.length > 0 && results_str2[results_str2.length - 1][1] == status) {
            results_str2[results_str2.length - 1][0] += char;
        } else {
            results_str2.push([char, status]);
        }

    }

    const elements1 = [];
    const elements2 = [];

    const className = (status: string) => {
        switch (status) {
            case "match":
                return "popup-text-correct";
            case "fuzzy":
                return "popup-text-semicorrect";
            case "mismatch":
            case "new":
                return "popup-text-incorrect";
        }
    }

    for (let i = 0; i < results_str1.length; i++) {
        elements1.push(<span key={i} className={className(results_str1[i][1])}>{results_str1[i][0]}</span>)
    }

    for (let i = 0; i < results_str2.length; i++) {
        elements2.push(<span key={i} className={className(results_str2[i][1])}>{results_str2[i][0]}</span>)
    }

    // console.log(results_str1);
    // console.log(results_str2);

    return [elements1, elements2, ans]
}

export default function AnswerPopup({show = false, text = "45.\tNauka biologiczna badająca wzajemne zależności między organizmami a środowiskiem i odwrotnie", answer = "biologia", correct = "ekologia", index = 1, onClick = () => {}}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [word2, word1, status] = answerCheker(answer, correct);

    const title = (() => {
        switch (status) {
            case 0:
                return "Poprawna odpowiedz!";
            case 1:
                return "Uważaj na kreski!";
            case 2:
                return "Pomyliłeś!";
        }
    }) ();

    return (
        <div className={"popup-container" + (show? "" : " popup-disabled")}  ref={popupRef}>
            <div className={"popup-background"}></div>
            <TornCard width={350} height={450}>
                <div className={"name-card-container"}>
                    <h6 className={"popup-title"}>{title}</h6>
                    <span className={"popup-description"}>{getQuestion(index)}</span>
                    <div className={"popup-answer-container"}>
                        <div className={"popup-subtitle"}>Poprawna odpowiedz:</div>
                        <div className={"popup-answer"}> {word1}</div>
                    </div>
                    <div className={"popup-answer-container"}>
                        <div className={"popup-subtitle"}>Twoja odpowiedz:</div>
                        <div className={"popup-answer"}> {word2}</div>
                    </div>

                    <button className={"name-button"} onClick={
                        () => { onClick()

                        }
                    }>OK</button>
                </div>
            </TornCard>
        </div>
    )
}