<?php

namespace SplitSMS;

class SplitSMSError extends \Exception
{
    /** @var string|null */
    public $errorCode;

    /** @var int|null */
    public $httpStatus;

    public function __construct($message, $errorCode = null, $httpStatus = null)
    {
        parent::__construct($message);
        $this->errorCode = $errorCode;
        $this->httpStatus = $httpStatus;
    }
}
