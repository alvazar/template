<?php
namespace alvazar;

class Template {
	public function __construct() {
	}
	
	protected function _getBlockTemplate($name,$template) {
		$regexp = "/(\<\!\-\-\s?(b\[{$name}\])\s?\{\s?\-\-\>.+\<\!\-\-\s?\}\s?\g{2}\s?\-\-\>)/us";
		preg_match_all($regexp,$template,$match);
		return !empty($match[1][0]) ? $match[1][0] : "";
	}
	
	public function make($path,$data,$onlyBlock="") {
		$template = file_get_contents($path);
		return $this->makeTemplate($template,$data,$onlyBlock);
	}

	public function makeTemplate($template,$data,$onlyBlock="") {
		if ($onlyBlock !== "") {
			$template = $this->_getBlockTemplate($onlyBlock,$template);
		}
		foreach ($data as $name => $value) {
			$template = $this->_blockReplace($name,$value,$template);
		}
		return $template;
	}
	
	protected function _blockReplace($name,$data,$template) {
		$blockTemplate = $this->_getBlockTemplate($name,$template);
		$blockMaked = $blockTemplate;
		
		// remove block
		if ($data === false) {
			return str_replace($blockMaked,"",$template);
		}
		
		$isMultiple = is_array($data) && isset($data[0]);
		
		// prepare
		if ($isMultiple) {
			$blockMaked = "";
			foreach ($data as $value) {
				if (is_array($value)) {
					$blockMaked .= $this->_blockReplace($name,$value,$blockTemplate);
				}
			}
		}
		else {
			foreach ($data as $key => $value) {
				// prepare sub block
				if (is_array($value) || $value === false) {
					$blockMaked = $this->_blockReplace($key,$value,$blockMaked);
				}
				// replace mask on value
				else {
					$blockMaked = str_replace('<!-- v['.$key.'] -->',$value,$blockMaked);
				}
			}
		}
		
		// replace block
		$template = str_replace($blockTemplate,$blockMaked,$template);
		
		return $template;
	}

	public function skipTemplateTags($content) {
		$regexp = "/\<\!\-\-(\s?\}|)\s?[bv]\[[^\]]+\]\s?(\{\s?|)\-\-\>/us";
		return preg_replace($regexp,"",$content);
	}
}