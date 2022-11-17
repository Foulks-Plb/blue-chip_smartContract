pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Bc is Ownable {
    event Bet(address indexed from, uint256 indexed id, uint256 _value);

    struct Match {
        bool isActive;
        uint256 price;
        uint256 endAt;
        uint256 royalties;
    }

    struct MatchData {
        uint256 pricePool;
        uint256 inA;
        uint256 inB;
        uint256 inEquality;
    }

    struct ResultMatch {
        bool winA;
        bool winB;
        bool equality;
    }

    mapping(uint256 => Match) public matchId;
    mapping(uint256 => ResultMatch) public idResult;
    mapping(uint256 => MatchData) public idData;

    mapping(uint256 => mapping(address => uint256)) public idAddressNbrbet;
    mapping(uint256 => mapping(address => mapping(uint256 => ResultMatch)))
        public idAddressBetResult;

    mapping(uint256 => mapping(address => mapping(uint256 => uint256)))
        public idAddressBetLeverage;

    mapping(uint256 => mapping(address => mapping(uint256 => bool)))
        public idAddressBetIsClaim;
    modifier idGoodLogic(
        bool _winA,
        bool _winB,
        bool _equality
    ) {
        require(
            (_winA && !_winB && !_equality) ||
                (!_winA && _winB && !_equality) ||
                (!_winA && !_winB && _equality),
            "wrong logic"
        );
        _;
    }

    constructor() {}

    function bet(
        uint256 _id,
        uint256 _leverage,
        bool _winA,
        bool _winB,
        bool _equality
    ) public payable idGoodLogic(_winA, _winB, _equality) {
        Match memory _match = matchId[_id];

        require(_match.isActive, "not active");
        require(_match.endAt > block.timestamp, "out time");
        require(_match.price * _leverage == msg.value, "wrong value");

        uint256 _betId = idAddressNbrbet[_id][msg.sender];
        idAddressBetResult[_id][msg.sender][_betId] = ResultMatch(
            _winA,
            _winB,
            _equality
        );

        if (_winA) {
            idData[_id].inA += _leverage;
        } else if (_winB) {
            idData[_id].inB += _leverage;
        } else if (_equality) {
            idData[_id].inEquality += _leverage;
        }

        uint256 royalties = (msg.value * _match.royalties) / 100;
        payable(owner()).transfer(royalties);
        emit Bet(msg.sender, _id, msg.value);

        idData[_id].pricePool += msg.value - royalties;
        idAddressBetLeverage[_id][msg.sender][_betId] += _leverage;

        idAddressNbrbet[_id][msg.sender]++;
    }

    function claim(uint256 _id, uint256 _betId) public {
        ResultMatch memory _resultM = idResult[_id];
        ResultMatch memory _resultU = idAddressBetResult[_id][msg.sender][
            _betId
        ];
        require(
            _resultU.winA == _resultM.winA &&
                _resultU.winB == _resultM.winB &&
                _resultU.equality == _resultM.equality,
            "not eligible"
        );
        require(!idAddressBetIsClaim[_id][msg.sender][_betId], "already claim");
        require(matchId[_id].endAt < block.timestamp, "out time");

        MatchData memory _data = idData[_id];
        uint256 place;
        if (_resultM.winA) {
            place = _data.pricePool / _data.inA;
        } else if (_resultM.winB) {
            place = _data.pricePool / _data.inB;
        } else if (_resultM.equality) {
            place = _data.pricePool / _data.inEquality;
        }

        idAddressBetIsClaim[_id][msg.sender][_betId] = true;
        uint256 gain = place * idAddressBetLeverage[_id][msg.sender][_betId];
        payable(msg.sender).transfer(gain);
    }

    function setMatch(
        uint256 _id,
        bool _isActive,
        uint256 _price,
        uint256 _endAt,
        uint256 _royalties
    ) public onlyOwner {
        matchId[_id] = Match(_isActive, _price, _endAt, _royalties);
    }

    function setResult(
        uint256 _id,
        bool _winA,
        bool _winB,
        bool _equality
    ) public onlyOwner idGoodLogic(_winA, _winB, _equality) {
        idResult[_id] = ResultMatch(_winA, _winB, _equality);
    }

    function getTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}
